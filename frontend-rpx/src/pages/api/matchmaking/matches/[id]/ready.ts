import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas aceitar requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Pegar o ID da partida dos parâmetros da URL
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID da partida é obrigatório' });
  }

  try {
    const { userId, isReady } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Buscar partida pelo ID
    const match = await db.collection('matches').findOne({ id });

    if (!match) {
      return res.status(404).json({ error: 'Partida não encontrada' });
    }

    // Verificar se o usuário está na partida
    let found = false;
    let teamIndex = -1;
    let playerIndex = -1;

    for (let i = 0; i < match.teams.length; i++) {
      const team = match.teams[i];
      for (let j = 0; j < team.players.length; j++) {
        if (team.players[j].id === userId) {
          found = true;
          teamIndex = i;
          playerIndex = j;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      return res.status(404).json({ error: 'Jogador não está na partida' });
    }

    // Atualizar o status de "pronto" do jogador
    const updatePath = `teams.${teamIndex}.players.${playerIndex}.isReady`;
    
    await db.collection('matches').updateOne(
      { id },
      { $set: { [updatePath]: isReady, updatedAt: new Date() } }
    );

    // Buscar partida atualizada
    const updatedMatch = await db.collection('matches').findOne({ id });

    // Verificar se todos os jogadores estão prontos
    const allPlayersReady = updatedMatch.teams.every(team => 
      team.players.every(player => player.isReady)
    );

    return res.status(200).json({
      success: true,
      allPlayersReady,
      match: updatedMatch
    });
  } catch (error) {
    console.error('Erro ao processar solicitação de pronto:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
} 