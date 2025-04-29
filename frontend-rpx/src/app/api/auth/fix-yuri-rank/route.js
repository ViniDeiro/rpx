import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Rota GET para corrigir o rank do usuário Yuri para ouro
export async function GET(request) {
  try {
    // Verificar se estamos em ambiente de desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
        { status: 403 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Atualizar o rank do Yuri para Gold II
    const result = await db.collection('users').updateOne(
      { username: 'yuri' },
      {
        $set: {
          currentRank: 'Ouro 2',
          rankingPoints: 800
        }
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('Usuário Yuri não encontrado');
      return NextResponse.json(
        { error: 'Usuário Yuri não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Rank do Yuri atualizado para Ouro 2',
      updated: result.modifiedCount > 0
    });
  } catch (error) {
    console.error('Erro ao atualizar rank do Yuri:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar rank', details: error.message },
      { status: 500 }
    );
  }
} 