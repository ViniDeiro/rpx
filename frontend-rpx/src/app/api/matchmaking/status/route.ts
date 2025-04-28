import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const waitingId = searchParams.get('waitingId');
    const forceCheck = searchParams.get('forceCheck') === 'true';
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se há uma partida em andamento para o usuário
    const activeMatch = await db.collection('matches').findOne({
      'players.userId': userId,
      status: 'in_progress'
    });
    
    if (activeMatch) {
      return NextResponse.json({
        status: 'in_match',
        matchId: activeMatch.matchId
      });
    }
    
    // Verificar se há uma partida em espera
    // Só retorna partida em espera se waitingId estiver presente OU forceCheck for true
    if (waitingId || forceCheck) {
      // Filtro para encontrar partidas em espera com este usuário
      const waitingFilter: any = {
        'players.userId': userId,
        status: 'waiting'
      };
      
      // Se tiver waitingId específico, usar ele no filtro
      if (waitingId) {
        waitingFilter.matchId = waitingId;
      }
      
      // Verificar partidas criadas nos últimos 10 minutos
      const tenMinutesAgo = new Date();
      tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
      waitingFilter.createdAt = { $gte: tenMinutesAgo };
      
      const waitingMatch = await db.collection('matches').findOne(waitingFilter);
      
      if (waitingMatch) {
        return NextResponse.json({
          status: 'waiting',
          matchId: waitingMatch.matchId,
          createdAt: waitingMatch.createdAt
        });
      }
    }
    
    // Verificar também se há notificações de partida encontrada
    // Este é um mecanismo de redundância caso a partida não seja encontrada diretamente
    if (forceCheck) {
      try {
        // Definir o limite de tempo novamente para este escopo
        const recentTimeLimit = new Date();
        recentTimeLimit.setMinutes(recentTimeLimit.getMinutes() - 10);
        
        const recentNotification = await db.collection('notifications').findOne({
          userId: userId,
          type: 'matchmaking',
          'data.type': 'match_found',
          read: false,
          createdAt: { $gte: recentTimeLimit }
        }, {
          sort: { createdAt: -1 } // Mais recente primeiro
        });
        
        if (recentNotification && recentNotification.data?.matchId) {
          console.log(`Encontrada notificação de partida: ${recentNotification.data.matchId}`);
          
          // Verificar se a partida existe
          const matchExists = await db.collection('matches').findOne({
            matchId: recentNotification.data.matchId
          });
          
          if (matchExists) {
            return NextResponse.json({
              status: 'waiting',
              matchId: recentNotification.data.matchId,
              createdAt: recentNotification.createdAt,
              fromNotification: true
            });
          }
        }
      } catch (notifError) {
        console.error('Erro ao verificar notificações:', notifError);
        // Continuar mesmo com erro
      }
    }
    
    // Nenhuma partida encontrada
    return NextResponse.json({
      status: 'no_match'
    });
    
  } catch (error) {
    console.error('Erro ao verificar status de matchmaking:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status de matchmaking' },
      { status: 500 }
    );
  }
}

// Endpoint para limpeza manual de partidas antigas (Admin apenas)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ status: "unauthenticated" }, { status: 401 });
    }

    // Verificar se é admin
    if (!session.user.isAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    // Definir limite de tempo para limpeza (24 horas)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    // Atualizar partidas antigas para status 'abandoned'
    const result = await db.collection("matches").updateMany(
      {
        createdAt: { $lt: oneDayAgo },
        status: { $in: ["waiting", "in_progress"] }
      },
      {
        $set: { status: "abandoned", updatedAt: new Date() }
      }
    );

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} partidas antigas marcadas como abandonadas`,
    });
  } catch (error) {
    console.error("Erro ao limpar partidas antigas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 