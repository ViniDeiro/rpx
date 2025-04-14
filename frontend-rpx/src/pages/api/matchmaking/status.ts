import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas aceitar requisições GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Extrair parâmetros da requisição
    const { userId, waitingId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Conectar ao banco de dados (MongoDB)
    const { db } = await connectToDatabase();

    // Verificar se o usuário ainda está na fila
    const queuedPlayer = await db.collection('matchmaking_queue').findOne({
      userId
    });

    // Verificar se o usuário já foi associado a uma partida real
    const playerMatch = await db.collection('matches').findOne({
      'teams.players.id': userId,
      status: { $in: ['waiting_players', 'in_progress'] }
    });

    // Se o jogador não estiver mais na fila e tiver uma partida, significa que foi encontrado um match
    if (!queuedPlayer && playerMatch) {
      return res.status(200).json({
        matchFound: true,
        match: playerMatch
      });
    }

    // Se o jogador ainda estiver na fila, verificar quanto tempo está esperando
    if (queuedPlayer) {
      const waitTime = new Date().getTime() - new Date(queuedPlayer.createdAt).getTime();
      
      // Se estiver esperando há muito tempo (mais de 30 segundos no ambiente de teste),
      // podemos criar uma partida com um bot ou outro jogador simulado
      if (waitTime > 30000) {
        // Remover o jogador da fila
        await db.collection('matchmaking_queue').deleteOne({ userId });
        
        // Recuperar informações do usuário
        const userInfo = await db.collection('users').findOne({ id: userId });
        
        // Criar uma partida com um adversário simulado
        const matchId = `match-${Date.now()}`;
        
        // Criar os times
        const team1 = {
          id: 'team1',
          name: 'Time 1',
          players: [{
            id: userId,
            name: userInfo?.name || 'Jogador',
            avatar: userInfo?.avatarId,
            isReady: true,
            isCaptain: true,
            team: 'team1'
          }]
        };
        
        const team2 = {
          id: 'team2',
          name: 'Time 2',
          players: [{
            id: `bot-${Date.now()}`,
            name: 'Adversário',
            avatar: '/images/avatars/default.png',
            isReady: true,
            isCaptain: true,
            team: 'team2'
          }]
        };
        
        // Gerar ID e senha da sala
        const roomId = `RPX${Math.floor(10000 + Math.random() * 90000)}`;
        const roomPassword = `pass${Math.floor(100 + Math.random() * 900)}`;
        
        // Buscar salas oficiais disponíveis que correspondem ao tipo de lobby atual
        const adminRooms = await db.collection('admin_rooms').find({
          gameType: queuedPlayer.mode,
          isOfficialRoom: true,
          configuredRoom: true
        }).toArray();
        
        let match;
        
        // Se houver salas oficiais disponíveis, usar uma delas
        if (adminRooms.length > 0) {
          const selectedRoom = adminRooms[Math.floor(Math.random() * adminRooms.length)];
          
          match = {
            id: matchId,
            title: `Partida Oficial ${selectedRoom.format} #${Math.floor(10000 + Math.random() * 90000)}`,
            mode: queuedPlayer.mode,
            type: queuedPlayer.type,
            status: 'waiting_players',
            teamSize: queuedPlayer.teamSize,
            platform: queuedPlayer.platform,
            entryFee: selectedRoom.entryFee || 10,
            prize: (selectedRoom.entryFee || 10) * 1.8,
            odd: 1.8,
            teams: [team1, team2],
            createdAt: new Date(),
            updatedAt: new Date(),
            paymentOption: 'split',
            createdBy: 'system',
            roomId: selectedRoom.roomId,
            roomPassword: selectedRoom.roomPassword,
            gameDetails: selectedRoom.gameDetails,
            isOfficialRoom: true,
            gameType: queuedPlayer.mode
          };
        } else {
          // Criar partida normal
          match = {
            id: matchId,
            title: `Partida ${queuedPlayer.mode.charAt(0).toUpperCase() + queuedPlayer.mode.slice(1)} #${Math.floor(10000 + Math.random() * 90000)}`,
            mode: queuedPlayer.mode,
            type: queuedPlayer.type,
            status: 'waiting_players',
            teamSize: queuedPlayer.teamSize,
            platform: queuedPlayer.platform,
            entryFee: 10,
            prize: 18,
            odd: 1.8,
            teams: [team1, team2],
            createdAt: new Date(),
            updatedAt: new Date(),
            paymentOption: 'split',
            createdBy: 'system',
            roomId,
            roomPassword
          };
        }
        
        // Salvar a partida no banco
        await db.collection('matches').insertOne(match);
        
        return res.status(200).json({
          matchFound: true,
          match
        });
      }
    }

    // Se não encontrou partida, retornar status de espera
    return res.status(200).json({
      matchFound: false,
      waitingId,
      message: 'Procurando partida...'
    });
  } catch (error) {
    console.error('Erro ao verificar status do matchmaking:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
} 