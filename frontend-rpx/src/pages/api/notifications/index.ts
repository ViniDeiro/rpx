import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import mongoose from 'mongoose';
import NotificationModel from '@/models/notification.model';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar autenticação do usuário
  const session = await getSession({ req });
  if (!session || !session.user) {
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }

  // Obter ID do usuário (em produção, seria uma propriedade do objeto session.user)
  const userId = (session.user as any).id || 'user-123'; // ID simulado para desenvolvimento

  // Conexão com o MongoDB
  if (!mongoose.connections[0].readyState) {
    try {
      await mongoose.connect(process.env.MONGODB_URI as string);
    } catch (error) {
      console.error('Erro ao conectar com o MongoDB:', error);
      return res.status(500).json({ success: false, message: 'Erro ao conectar com o banco de dados' });
    }
  }

  // Roteamento baseado no método HTTP
  switch (req.method) {
    case 'GET':
      return getNotifications(req, res, userId);
    case 'PUT':
      return markAsRead(req, res, userId);
    case 'POST':
      // Apenas administradores podem criar notificações diretamente
      if ((session.user as any).role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Permissão negada' });
      }
      return createNotification(req, res);
    default:
      return res.status(405).json({ success: false, message: 'Método não permitido' });
  }
}

// Obter notificações do usuário
async function getNotifications(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { limit = '20', offset = '0', unreadOnly = 'false' } = req.query;
    
    // Construir filtro
    const filter: any = { userId };
    
    if (unreadOnly === 'true') {
      filter.read = false;
    }
    
    // Em produção, usaríamos o modelo Mongoose
    /*
    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset as string))
      .limit(parseInt(limit as string))
      .exec();
      
    const total = await NotificationModel.countDocuments(filter);
    const unreadCount = await NotificationModel.countDocuments({ userId, read: false });
    */
    
    // Simular dados para desenvolvimento
    const mockNotifications = Array.from({ length: 10 }).map((_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - i);
      
      const types = ['verification', 'payment', 'system', 'match'];
      const type = types[i % types.length] as 'verification' | 'payment' | 'system' | 'match';
      
      let title = '';
      let message = '';
      let data: any = {};
      
      switch (type) {
        case 'verification':
          title = 'Resultado verificado';
          message = `Seu resultado da partida #${500 + i} foi ${i % 2 === 0 ? 'aprovado' : 'rejeitado'}.`;
          data = { matchId: `match-${500 + i}`, status: i % 2 === 0 ? 'approved' : 'rejected' };
          break;
        case 'payment':
          title = 'Pagamento processado';
          message = `Você recebeu R$ ${(10 * (i + 1)).toFixed(2)} de premiação.`;
          data = { transactionId: `tx-${1000 + i}`, amount: 10 * (i + 1) };
          break;
        case 'system':
          title = 'Sistema atualizado';
          message = 'Novos recursos foram adicionados à plataforma.';
          break;
        case 'match':
          title = 'Nova partida disponível';
          message = `Uma partida do seu interesse foi criada: Squad #${500 + i}.`;
          data = { matchId: `match-${500 + i}` };
          break;
      }
      
      return {
        id: `notif-${1000 + i}`,
        userId,
        type,
        title,
        message,
        read: i > 3, // Primeiras 4 notificações não lidas
        data,
        createdAt: date.toISOString()
      };
    });
    
    // Filtrar notificações simuladas
    let filteredNotifications = [...mockNotifications];
    
    if (unreadOnly === 'true') {
      filteredNotifications = filteredNotifications.filter(n => !n.read);
    }
    
    // Aplicar paginação
    const paginatedNotifications = filteredNotifications.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );
    
    return res.status(200).json({
      success: true,
      data: {
        notifications: paginatedNotifications,
        total: filteredNotifications.length,
        unreadCount: filteredNotifications.filter(n => !n.read).length
      }
    });
  } catch (error) {
    console.error('Erro ao obter notificações:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
}

// Marcar notificação como lida
async function markAsRead(req: NextApiRequest, res: NextApiResponse, userId: string) {
  try {
    const { id, all = 'false' } = req.body;
    
    if (all === 'true') {
      // Em produção, usaríamos o modelo Mongoose
      /*
      await NotificationModel.updateMany(
        { userId, read: false },
        { $set: { read: true, updatedAt: new Date() } }
      );
      */
      
      return res.status(200).json({
        success: true,
        message: 'Todas as notificações foram marcadas como lidas'
      });
    }
    
    if (!id) {
      return res.status(400).json({ success: false, message: 'ID é obrigatório' });
    }
    
    // Em produção, usaríamos o modelo Mongoose
    /*
    const notification = await NotificationModel.findOne({ _id: id, userId });
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notificação não encontrada' });
    }
    
    notification.read = true;
    notification.updatedAt = new Date();
    await notification.save();
    */
    
    return res.status(200).json({
      success: true,
      message: 'Notificação marcada como lida',
      data: {
        id,
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
async function createNotification(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, type, title, message, data } = req.body;
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ success: false, message: 'Dados incompletos' });
    }
    
    if (!['verification', 'payment', 'system', 'match'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipo inválido' });
    }
    
    // Em produção, usaríamos o modelo Mongoose
    /*
    const notification = await NotificationModel.createNotification(
      userId,
      type,
      title,
      message,
      data
    );
    */
    
    return res.status(201).json({
      success: true,
      message: 'Notificação criada com sucesso',
      data: {
        id: `notif-${Date.now()}`,
        userId,
        type,
        title,
        message,
        data,
        read: false,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return res.status(500).json({ success: false, message: 'Erro ao processar requisição' });
  }
} 