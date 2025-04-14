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
    const { userId, captainId } = req.body;

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

    // Verificar se a partida já está em andamento
    if (match.status === 'in_progress') {
      return res.status(400).json({ error: 'Partida já está em andamento' });
    }

    // Verificar se a partida já foi concluída
    if (match.status === 'completed') {
      return res.status(400).json({ error: 'Partida já foi concluída' });
    }

    // Verificar se o usuário é o capitão (ou se a partida é oficial)
    let isCaptain = false;
    if (match.isOfficialRoom) {
      // Em salas oficiais, qualquer jogador pode iniciar se todos estiverem prontos
      isCaptain = true;
    } else {
      // Em salas normais, apenas o capitão pode iniciar
      for (const team of match.teams) {
        for (const player of team.players) {
          if (player.id === userId && player.isCaptain) {
            isCaptain = true;
            break;
          }
        }
        if (isCaptain) break;
      }
    }

    if (!isCaptain) {
      return res.status(403).json({ error: 'Apenas o capitão pode iniciar a partida' });
    }

    // Verificar se todos os jogadores estão prontos
    const allPlayersReady = match.teams.every((team: { players: any[] }) => 
      team.players.every((player: { isReady: boolean }) => player.isReady)
    );

    if (!allPlayersReady) {
      return res.status(400).json({ error: 'Nem todos os jogadores estão prontos' });
    }

    // Atualizar o status da partida para "em andamento"
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

    // Buscar partida atualizada
    const updatedMatch = await db.collection('matches').findOne({ id });

    return res.status(200).json({
      success: true,
      match: updatedMatch
    });
  } catch (error) {
    console.error('Erro ao iniciar partida:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
} 