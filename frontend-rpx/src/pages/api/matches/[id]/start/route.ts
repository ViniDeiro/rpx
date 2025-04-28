import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas aceitar requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id } = req.query;
    const { userId } = req.body; // ID do usuário que está iniciando a partida (opcional)

    if (!id) {
      return res.status(400).json({ error: 'ID da partida é obrigatório' });
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Buscar a partida
    const match = await db.collection('matches').findOne({ id });

    if (!match) {
      return res.status(404).json({ error: 'Partida não encontrada' });
    }

    console.log(`✅ Iniciando partida: ${id}`);

    // Extrair IDs de todos os jogadores na partida
    const playerIds = match.teams?.flatMap((team: any) => 
      team.players?.map((player: any) => player.id || player.userId)
    ).filter(Boolean) || [];

    if (playerIds.length === 0) {
      return res.status(400).json({ error: 'Partida não possui jogadores' });
    }

    console.log(`👥 Jogadores na partida: ${playerIds.join(', ')}`);

    // Atualizar o status da partida para 'in_progress'
    await db.collection('matches').updateOne(
      { id },
      { 
        $set: { 
          status: 'in_progress',
          startedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    // AGORA podemos remover os jogadores da fila de matchmaking
    // Isso resolve o problema #5, pois só removemos quando realmente entram na partida
    const queueResult = await db.collection('matchmaking_queue').deleteMany({
      userId: { $in: playerIds }
    });

    console.log(`🧹 Jogadores removidos da fila: ${queueResult.deletedCount}`);

    // Registrar a entrada do usuário na partida (opcional)
    if (userId) {
      await db.collection('match_logs').insertOne({
        matchId: id,
        userId,
        action: 'join',
        timestamp: new Date(),
        role: 'player'
      });
    }

    return res.status(200).json({
      success: true,
      matchId: id,
      message: 'Partida iniciada com sucesso',
      playersJoined: playerIds.length,
      playersRemovedFromQueue: queueResult.deletedCount
    });
  } catch (error) {
    console.error('Erro ao iniciar partida:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
} 