import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas aceitar requisições GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { userId, waitingId } = req.query;

    if (!userId || !waitingId) {
      return res.status(400).json({ error: 'ID do usuário e ID de espera são obrigatórios' });
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se o usuário já está em uma partida existente
    const existingMatch = await db.collection('matches').findOne({
      $or: [
        { 'teams.team1.players.id': userId },
        { 'teams.team2.players.id': userId }
      ],
      status: { $in: ['waiting_players', 'in_progress'] }
    });

    if (existingMatch) {
      return res.status(200).json({
        matchFound: true,
        match: existingMatch
      });
    }

    // Verificar se o usuário ainda está na fila
    const queuedPlayer = await db.collection('matchmaking_queue').findOne({
      userId
    });

    // Se o jogador ainda estiver na fila, indicar que ainda está procurando
    if (queuedPlayer) {
      const waitTime = new Date().getTime() - new Date(queuedPlayer.createdAt).getTime();
      
      // Simplesmente retornar que ainda está procurando uma partida
      return res.status(200).json({
        matchFound: false,
        message: 'Ainda procurando uma partida',
        waitingTime: Math.floor(waitTime / 1000) // Tempo em segundos
      });
    }

    // Se chegou aqui, o jogador não está mais na fila, mas também não tem partida
    return res.status(404).json({ 
      error: 'Você não está mais na fila de matchmaking' 
    });
  } catch (error) {
    console.error('Erro ao verificar status do matchmaking:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
} 