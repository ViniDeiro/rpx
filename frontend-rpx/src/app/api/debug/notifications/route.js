import { NextResponse } from 'next/server';

// Notificações de exemplo para testes
const mockNotifications = [
  {
    id: '65f1a2b3c4d5e6f7a8b9c0d1',
    type: 'system',
    title: 'Bem-vindo ao RPX',
    message: 'Bem-vindo à plataforma RPX! Estamos felizes em tê-lo conosco.',
    read: false,
    userId: 'user_test',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    data: {}
  },
  {
    id: '65f1a2b3c4d5e6f7a8b9c0d2',
    type: 'payment',
    title: 'Pagamento Confirmado',
    message: 'Seu pagamento de R$ 50,00 foi confirmado.',
    read: false,
    userId: 'user_test',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    data: {
      amount: 50.0,
      paymentId: 'pay_123456789',
      method: 'pix'
    }
  },
  {
    id: '65f1a2b3c4d5e6f7a8b9c0d3',
    type: 'lobby_invite',
    title: 'Convite para Lobby',
    message: 'Você foi convidado para participar de uma partida por João Silva',
    read: false,
    userId: 'user_test',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    data: {
      lobbyId: 'lobby_123',
      inviterId: 'user_789',
      inviterName: 'João Silva',
      gameTitle: 'Counter Strike 2'
    }
  }
];

// Endpoint de depuração para notificações
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'fetch';
    
    if (action === 'fetch') {
      return NextResponse.json({
        success: true,
        data: mockNotifications
      });
    } else if (action === 'clear') {
      return NextResponse.json({
        success: true,
        message: 'Notificações limpas com sucesso (simulação)'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Ação desconhecida'
      });
    }
  } catch (error) {
    console.error('Erro na API de notificações:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Notificação criada/atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao processar notificação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
} 