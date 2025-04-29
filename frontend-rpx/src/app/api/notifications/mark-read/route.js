import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function PUT(req) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 400 });
    }
    
    // Obter ID da notificação da URL
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da notificação não fornecido' },
        { status: 400 });
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Tentar converter para ObjectId 
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'ID de notificação inválido' },
        { status: 400 });
    }
    
    // Atualizar a notificação para marcar como lida
    const result = await db.collection('notifications').updateOne(
      { _id: objectId, userId: session.user.id },
      { $set: { isRead: true, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Notificação não encontrada ou sem permissão' },
        { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notificação marcada como lida'
    });
    
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 400 });
  }
} 