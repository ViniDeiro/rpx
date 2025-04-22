import { NextRequest, NextResponse } from 'next/server';
import { POST as processMatchmaking } from '../../lobby/matchmaking/process/route';

// Endpoint para depuração - processa a fila de matchmaking sem autenticação
export async function GET(request: NextRequest) {
  try {
    // Criar uma requisição simulada com o cabeçalho de autorização
    const simulatedRequest = new Request(request.url, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${process.env.MATCHMAKING_API_KEY || 'rpx-matchmaking-secret'}`
      }
    }) as unknown as NextRequest;
    
    // Chamar o processador de matchmaking
    const response = await processMatchmaking(simulatedRequest);
    
    // Ler o corpo da resposta
    const result = await response.json();
    
    // Retornar o resultado com informações adicionais
    return NextResponse.json({
      ...result,
      _debug: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        message: 'Este endpoint é apenas para depuração. Em produção, use o endpoint /api/lobby/matchmaking/process com autenticação.'
      }
    });
  } catch (error: any) {
    console.error('Erro ao processar matchmaking (debug):', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao processar matchmaking: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
} 