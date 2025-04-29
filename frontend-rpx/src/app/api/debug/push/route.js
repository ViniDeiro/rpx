import { NextResponse } from 'next/server';

// Endpoint de depuração para notificações push
export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      message: 'API de notificações push - Modo de depuração',
      info: 'Esta API está disponível apenas para testes'
    });
  } catch (error) {
    console.error('Erro na API de push:', error);
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
      message: 'Notificação push simulada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao processar notificação push:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno no servidor' },
      { status: 500 }
    );
  }
} 