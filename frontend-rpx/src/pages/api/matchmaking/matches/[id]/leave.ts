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
    const { userId } = req.body;

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
    let isCaptain = false;

    for (let i = 0; i < match.teams.length; i++) {
      const team = match.teams[i];
      for (let j = 0; j < team.players.length; j++) {
        if (team.players[j].id === userId) {
          found = true;
          teamIndex = i;
          playerIndex = j;
          isCaptain = team.players[j].isCaptain;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      return res.status(404).json({ error: 'Jogador não está na partida' });
    }

    // Verificar se a partida já está em andamento
    if (match.status === 'in_progress' && !match.isOfficialRoom) {
      // Se a partida está em andamento e não é uma sala oficial,
      // não permitir sair (exceto se for um jogador comum em uma sala oficial)
      return res.status(400).json({ error: 'Não é possível sair de uma partida em andamento' });
    }

    // Se for o capitão e houver mais jogadores, transferir capitania
    let updatedMatch = { ...match };
    if (isCaptain && match.teams[teamIndex].players.length > 1) {
      // Encontrar o próximo jogador no time para ser capitão
      let newCaptainIndex = -1;
      for (let j = 0; j < match.teams[teamIndex].players.length; j++) {
        if (j !== playerIndex) {
          newCaptainIndex = j;
          break;
        }
      }

      if (newCaptainIndex !== -1) {
        // Transferir capitania
        const captainUpdatePath = `teams.${teamIndex}.players.${newCaptainIndex}.isCaptain`;
        await db.collection('matches').updateOne(
          { id },
          { $set: { [captainUpdatePath]: true } }
        );
      }
    }

    // Remover o jogador da partida
    await db.collection('matches').updateOne(
      { id },
      { 
        $pull: { [`teams.${teamIndex}.players`]: { id: userId } },
        $set: { updatedAt: new Date() }
      }
    );

    // Verificar se a partida ficou vazia após a saída do jogador
    const updatedMatchData = await db.collection('matches').findOne({ id });
    const totalPlayers = updatedMatchData.teams.reduce((count, team) => count + team.players.length, 0);

    // Se a partida ficou vazia, cancelá-la
    if (totalPlayers === 0) {
      await db.collection('matches').updateOne(
        { id },
        { 
          $set: { 
            status: 'canceled',
            updatedAt: new Date(),
            canceledReason: 'Todos os jogadores saíram'
          } 
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Jogador removido da partida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao sair da partida:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
} 