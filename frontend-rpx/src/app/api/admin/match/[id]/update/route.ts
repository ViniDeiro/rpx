import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// PUT - Atualizar detalhes da partida pelo admin
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o usuário é admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Apenas administradores podem acessar este recurso' },
        { status: 403 }
      );
    }

    const matchId = params.id;
    if (!matchId) {
      return NextResponse.json(
        { status: 'error', error: 'ID da partida não fornecido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      roomId,           // ID da sala no Free Fire
      roomPassword,     // Senha da sala
      status,           // Status da partida (pending, active, completed, etc)
      scheduledTime,    // Hora agendada para a partida
      adminNotes        // Notas do administrador
    } = body;

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se a partida existe
    const match = await db.collection('matches').findOne({
      _id: new ObjectId(matchId)
    });

    if (!match) {
      return NextResponse.json(
        { status: 'error', error: 'Partida não encontrada' },
        { status: 404 }
      );
    }

    // Dados para atualização
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
      lastAdminAction: {
        adminId: session.user.id || session.user.email,
        action: 'update',
        timestamp: new Date()
      }
    };

    // Adicionar campos opcionais se fornecidos
    if (roomId !== undefined) updateData.roomId = roomId;
    if (roomPassword !== undefined) updateData.roomPassword = roomPassword;
    if (status !== undefined) updateData.status = status;
    if (scheduledTime !== undefined) updateData.scheduledTime = new Date(scheduledTime);
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    // Verificar se está definindo o ID/senha da sala
    if (roomId && roomPassword && !match.roomId) {
      // Se estiver adicionando ID/senha pela primeira vez, definir timer
      updateData.roomCreatedAt = new Date();
      
      // Criar notificações para todos os jogadores
      const participants = match.players || [];
      
      for (const player of participants) {
        await db.collection('notifications').insertOne({
          userId: player.userId,
          type: 'system',
          title: 'ID e Senha da Sala Disponíveis',
          message: 'O administrador criou a sala para sua partida. Você tem 5 minutos para entrar.',
          read: false,
          data: {
            type: 'match_room',
            matchId: matchId,
            roomId: roomId,
            roomPassword: roomPassword
          },
          createdAt: new Date()
        });
      }
    }

    // Se estiver mudando para status 'active'
    if (status === 'active' && match.status !== 'active') {
      updateData.startTime = new Date();
    }

    // Atualizar a partida
    await db.collection('matches').updateOne(
      { _id: new ObjectId(matchId) },
      { $set: updateData }
    );

    // Registrar log de auditoria
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id || session.user.email,
      adminEmail: session.user.email,
      action: 'match_update',
      entity: 'match',
      entityId: matchId,
      changes: updateData,
      timestamp: new Date()
    });

    return NextResponse.json({
      status: 'success',
      message: 'Partida atualizada com sucesso',
      matchId: matchId,
      updates: updateData
    });
    
  } catch (error: any) {
    console.error('Erro ao atualizar partida:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao atualizar partida: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 