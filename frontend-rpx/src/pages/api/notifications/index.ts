import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação do usuário
  const session = await getSession({ req });
  if (!session || !session.user) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  // Obter ID do usuário da sessão
  const userId = (session.user as any).id;
  if (!userId) {
    return res.status(400).json({ success: false, message: 'ID de usuário inválido' });
  }

  // Conexão com o MongoDB
  try {
    const { db } = await connectToDatabase();
    
    if (!db) {
      throw new Error('Falha ao conectar com o banco de dados');
    }

    // Roteamento baseado no método HTTP
    switch (req.method) {
      case 'GET':
        return getNotifications(req, res, userId, db);
      case 'PUT':
        return markAsRead(req, res, userId, db);
      case 'POST':
        // Apenas administradores podem criar notificações diretamente
        if ((session.user as any).role !== 'admin') {
          return res.status(403).json({ success: false, message: 'Permissão negada' });
        }
        return createNotification(req, res, db);
      default:
        return res.status(405).json({ success: false, message: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro de conexão:', error);
    return res.status(500).json({ success: false, message: 'Erro ao conectar com o banco de dados' });
  }
}

// Obter notificações do usuário
async function getNotifications(req: NextApiRequest, res: NextApiResponse, userId: string, db: any) {
  try {
    const { limit = '20', offset = '0', unreadOnly = 'false' } = req.query;
    
    // Construir filtro
    const filter: any = { 
      $or: [
        { userId: new ObjectId(userId) },
        { userId: userId.toString() }
      ]
    };
    
    if (unreadOnly === 'true') {
      filter.read = false;
    }
    
    // Buscar notificações do banco de dados
    const notificationsCollection = db.collection('notifications');
    
    // Contar total e não lidas para paginação e UI
    const total = await notificationsCollection.countDocuments(filter);
    const unreadCount = await notificationsCollection.countDocuments({ 
      $or: [
        { userId: new ObjectId(userId) },
        { userId: userId.toString() }
      ], 
      read: false 
    });
    
    // Buscar notificações com paginação e ordenação
    const notifications = await notificationsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string))
      .toArray();
    
    // Serializar ObjectId para strings
    const serializedNotifications = notifications.map((notification: any) => ({
      ...notification,
      id: notification._id.toString(),
      _id: notification._id.toString(),
      userId: typeof notification.userId === 'object' 
        ? notification.userId.toString() 
        : notification.userId
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        notifications: serializedNotifications,
        total,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Erro ao obter notificações:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
}

// Marcar notificação como lida
async function markAsRead(req: NextApiRequest, res: NextApiResponse, userId: string, db: any) {
  try {
    const { id, all = 'false' } = req.body;
    const notificationsCollection = db.collection('notifications');
    
    if (all === 'true') {
      // Marcar todas as notificações como lidas
      const result = await notificationsCollection.updateMany(
        { 
          $or: [
            { userId: new ObjectId(userId) },
            { userId: userId.toString() }
          ], 
          read: false 
        },
        { $set: { read: true, updatedAt: new Date() } }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Todas as notificações foram marcadas como lidas',
        data: { modifiedCount: result.modifiedCount }
      });
    }
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    
    // Marcar uma notificação específica como lida
    const notificationId = typeof id === 'string' ? new ObjectId(id) : id;
    
    const notification = await notificationsCollection.findOne({ 
      _id: notificationId,
      $or: [
        { userId: new ObjectId(userId) },
        { userId: userId.toString() }
      ]
    });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notificação não encontrada' });
    }
    
    const result = await notificationsCollection.updateOne(
      { _id: notificationId },
      { $set: { read: true, updatedAt: new Date() } }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Notificação marcada como lida',
      data: {
        id: id,
        read: true,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
}

// Criar notificação (apenas para administradores)
async function createNotification(req: NextApiRequest, res: NextApiResponse, db: any) {
  try {
    const { userId, type, title, message, data } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }
    
    if (!['verification', 'payment', 'system', 'match'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipo inválido' });
    }
    
    const notificationsCollection = db.collection('notifications');
    
    // Criar documento da notificação
    const notification = {
      userId: typeof userId === 'string' && userId.length === 24 ? new ObjectId(userId) : userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Inserir no banco de dados
    const result = await notificationsCollection.insertOne(notification);
    
    return res.status(201).json({
      success: true,
      message: 'Notificação criada com sucesso',
      data: {
        id: result.insertedId.toString(),
        ...notification,
        userId: typeof notification.userId === 'object' ? notification.userId.toString() : notification.userId,
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
} 