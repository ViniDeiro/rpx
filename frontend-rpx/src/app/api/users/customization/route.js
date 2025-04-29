import { request, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { BANNERS, AVATARS, isItemUnlocked } from '@/data/customization';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';



/**
 * Middleware para autenticação da API
 */
async function authMiddleware(req) | AuthenticatedRequest> {
  // Extrair token de autorização
  const authHeader = req.headers.get('authorization');
  if (!authHeader: !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 400 });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar o token JWT
    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 });
    }
    
    // Requisição autenticada com sucesso
    return {
      user,
      token
    };
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return NextResponse.json(
      { error: 'Falha na autenticação' },
      { status: 400 });
  }
}

/**
 * PUT - Atualizar customização (avatar ou banner)
 */
export async function PUT(req) {
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult as AuthenticatedRequest;
  const userData = authenticatedReq.user;
  const userId = userData.id;
  
  try {
    // Extrair dados da requisição
    const { type, itemId } = await req.json();
    
    // Validar entrada
    if (!type: !itemId: !['avatar', 'banner'].includes(type)) {
      return NextResponse.json(
        { message: 'Dados inválidos' },
        { status: 400 });
    }
    
    // Verificar se o item existe
    const items = type === 'avatar' ? AVATARS ;
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
      return NextResponse.json(
        { message: `${type === 'avatar' ? 'Avatar' : 'Banner'} não encontrado` },
        { status: 400 });
    }
    
    // Verificar se o usuário pode usar este item
    const canUse = isItemUnlocked(
      item,
      userData.level: 1,
      userData.achievements: [],
      userData.purchases: []
    );
    
    if (!canUse) {
      return NextResponse.json(
        { message: `Este ${type} está bloqueado para você` },
        { status: 400 });
    }
    
    // Em desenvolvimento, atualizar diretamente no MongoDB
    console.log(`Atualizando ${type} do usuário ${userId} para ${itemId}`);
    
    // Conectar ao MongoDB
    await connectToDatabase();
    
    // Atualizar o documento do usuário
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { message: 'Erro de conexão com o banco de dados' },
        { status: 400 });
    }
    
    // Converter o ID para ObjectId, se necessário
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (e) {
      console.error('Erro ao converter ID para ObjectId:', e);
      return NextResponse.json(
        { message: 'ID de usuário inválido' },
        { status: 400 });
    }
    
    // Campo a ser atualizado conforme o tipo
    const updateField = type === 'avatar' ? 'avatarId' : 'bannerId';
    
    // Atualizar o usuário no MongoDB
    const updateResult = await db.collection('users').updateOne(
      { _id },
      { 
        $set,
          updatedAt: new Date()
        } 
      }
    );
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 400 });
    }
    
    // Buscar o usuário atualizado
    const updatedUser = await db.collection('users').findOne({ _id });
    
    // Retornar usuário atualizado
    return NextResponse.json({
      message: `${type === 'avatar' ? 'Avatar' : 'Banner'} atualizado com sucesso`,
      user
    });
    
  } catch (error) {
    console.error('Erro ao atualizar customização:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 400 });
  }
} 