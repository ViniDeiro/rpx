import { NextResponse } from 'next/server';

// Endpoint de depuração para processamento de matchmaking
export async function GET(request) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Simulação de processamento de matchmaking concluída',
      timestamp: new Date().toISOString(),
      results: {
        processed: 0,
        matched: 0,
        pending: 0
      }
    });
  } catch (error) {
    console.error('Erro ao processar matchmaking:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao processar matchmaking',
        message: error.message 
      },
      { status: 500 }
    );
  }
} 