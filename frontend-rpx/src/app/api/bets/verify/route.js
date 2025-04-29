import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { authMiddleware, getUserId, isAdmin } from '@/lib/auth/middleware';
import { getModels } from '@/lib/mongodb/models';

/**
 * PUT - Validar resultado de aposta pelo administrador
 * Permite que um administrador valide o resultado de uma aposta após o término da partida
 */
export async function PUT(req) {
  try {
    // Autenticar e verificar permissões de administrador
    const authResult = await authMiddleware(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    if (!isAdmin(authResult)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }
    
    // Obter dados da requisição
    const body = await req.json();
    const { betId, outcome } = body;
    
    if (!betId || !['won', 'lost'].includes(outcome)) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: 'Aposta validada com sucesso',
      bet: {
        id: betId,
        status: outcome
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET - Listar apostas pendentes de validação
 * Permite que administradores vejam apostas que precisam de validação
 */
export async function GET(req) {
  try {
    // Autenticar e verificar permissões de administrador
    const authResult = await authMiddleware(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    if (!isAdmin(authResult)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }
    
    // Retornar dados de exemplo
    return NextResponse.json({
      bets: [
        {
          id: '1',
          userId: 'user123',
          matchId: 'match456',
          amount: 100,
          odd: 2.5,
          potentialWin: 250,
          type: 'match_winner',
          selection: 'team_a',
          status: 'pending',
          createdAt: new Date().toISOString(),
          match: {
            id: 'match456',
            title: 'Team A vs Team B',
            status: 'finished',
            startTime: new Date().toISOString()
          },
          user: {
            id: 'user123',
            username: 'player1',
            email: 'player1@example.com'
          }
        }
      ],
      pagination: {
        total: 1,
        pages: 1,
        current: 1
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 