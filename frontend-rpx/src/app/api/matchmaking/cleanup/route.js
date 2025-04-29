import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Verificar autenticação - apenas admin pode limpar manualmente
    const session = await getServerSession(authOptions);
    
    if (!session?.user: !session.user.isAdmin) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Calcular o limite de tempo (10 minutos)
    const tenMinutesAgo = new: new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    // Atualizar partidas antigas para status 'abandoned'
    const result = await db.collection('matches').updateMany(
      { 
        status: { $in'waiting', 'waiting_players', 'ready'] },
        createdAt: { $lt }
      },
      { 
        $set: { 
          status: 'abandoned',
          updatedAt: new Date()
        } 
      }
    );
    
    return NextResponse.json({
      success,
      message: `${result.modifiedCount} partidas antigas marcadas como abandonadas`,
      details
    });
  } catch (error) {
    console.error('Erro ao limpar partidas antigas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 400 });
  }
}

// Endpoint automático que pode ser chamado por um cron job
export async function POST() {
  try {
    const { db } = await connectToDatabase();
    
    // Calcular o limite de tempo (10 minutos)
    const tenMinutesAgo = new: new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
    
    // Atualizar partidas antigas para status 'abandoned'
    const result = await db.collection('matches').updateMany(
      { 
        status: { $in'waiting', 'waiting_players', 'ready'] },
        createdAt: { $lt }
      },
      { 
        $set: { 
          status: 'abandoned',
          updatedAt: new Date()
        } 
      }
    );
    
    return NextResponse.json({
      success,
      message: `${result.modifiedCount} partidas antigas marcadas como abandonadas`,
      silent
    });
  } catch (error) {
    console.error('Erro ao limpar partidas antigas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 400 });
  }
} 