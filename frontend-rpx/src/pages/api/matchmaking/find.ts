import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas aceitar requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Extrair parâmetros da requisição
    const { userId, mode, type, platform, platformMode, gameplayMode, teamSize } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Conectar ao banco de dados (MongoDB)
    const { db } = await connectToDatabase();

    // 1. Verificar se já existe uma fila de matchmaking para os critérios
    const matchmakingQueue = db.collection('matchmaking_queue');
    
    // 2. Buscar salas oficiais disponíveis criadas pelo admin
    const adminRooms = await db.collection('admin_rooms').find({
      gameType: mode,
      isOfficialRoom: true,
      configuredRoom: true
    }).toArray();

    // 3. Verificar outros jogadores na fila de matchmaking
    const queuedPlayers = await matchmakingQueue.find({
      mode,
      type,
      teamSize,
      platformMode: platformMode || 'mixed',
      gameplayMode: gameplayMode || 'normal',
      status: 'waiting',
      userId: { $ne: userId }, // Não incluir o próprio usuário
    }).toArray();

    // 4. Lógica principal de matchmaking
    let match;
    
    // Se houver salas oficiais disponíveis
    if (adminRooms.length > 0) {
      // Selecionar uma sala aleatória entre as disponíveis
      const selectedRoom = adminRooms[Math.floor(Math.random() * adminRooms.length)];
      
      // Verificar se há partida em andamento nesta sala com vagas
      const existingMatch = await db.collection('matches').findOne({
        roomId: selectedRoom.roomId,
        status: 'waiting_players',
        'teams.players': { $size: { $lt: teamSize * 2 } }
      });
      
      if (existingMatch) {
        // Adicionar jogador à partida existente
        match = existingMatch;
        
        // Encontrar um time com vaga e adicionar o jogador
        const teamIndex = match.teams[0].players.length < teamSize ? 0 : 1;
        
        // Recuperar informações do usuário
        const userInfo = await db.collection('users').findOne({ id: userId });
        
        // Adicionar jogador ao time
        match.teams[teamIndex].players.push({
          id: userId,
          name: userInfo?.name || 'Jogador',
          avatar: userInfo?.avatarId,
          isReady: true,
          isCaptain: match.teams[teamIndex].players.length === 0,
          team: `team${teamIndex + 1}`
        });
        
        // Atualizar partida no banco
        await db.collection('matches').updateOne(
          { id: match.id },
          { $set: {
              teams: match.teams,
              updatedAt: new Date()
            }
          }
        );
      } else {
        // Criar nova partida com a sala administrativa
        const matchId = `match-${Date.now()}`;
        
        // Recuperar informações do usuário
        const userInfo = await db.collection('users').findOne({ id: userId });
        
        // Criar times
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
          players: []
        };
        
        // Criar nova partida
        match = {
          id: matchId,
          title: `Partida Oficial ${selectedRoom.format} #${Math.floor(10000 + Math.random() * 90000)}`,
          mode,
          type,
          status: 'waiting_players',
          teamSize,
          platform,
          entryFee: selectedRoom.entryFee || 10,
          prize: (selectedRoom.entryFee || 10) * 1.8,
          odd: 1.8,
          teams: [team1, team2],
          createdAt: new Date(),
          updatedAt: new Date(),
          paymentOption: mode !== 'solo' ? 'split' : 'split',
          createdBy: 'system',
          roomId: selectedRoom.roomId,
          roomPassword: selectedRoom.roomPassword,
          gameDetails: selectedRoom.gameDetails,
          isOfficialRoom: true,
          gameType: mode
        };
        
        // Salvar nova partida no banco
        await db.collection('matches').insertOne(match);
      }
    }
    // Verificar se há jogadores na fila para fazer match
    else if (queuedPlayers.length > 0) {
      // Pegar o primeiro jogador na fila (poderia implementar lógica mais complexa)
      const matchedPlayer = queuedPlayers[0];
      
      // Remover o jogador encontrado da fila
      await matchmakingQueue.deleteOne({ userId: matchedPlayer.userId });
      
      // Criar uma nova partida para ambos
      const matchId = `match-${Date.now()}`;
      
      // Buscar informações dos usuários
      const [userInfo, matchedUserInfo] = await Promise.all([
        db.collection('users').findOne({ id: userId }),
        db.collection('users').findOne({ id: matchedPlayer.userId })
      ]);
      
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
          id: matchedPlayer.userId,
          name: matchedUserInfo?.name || 'Adversário',
          avatar: matchedUserInfo?.avatarId,
          isReady: true,
          isCaptain: true,
          team: 'team2'
        }]
      };
      
      // Gerar ID e senha da sala
      const roomId = `RPX${Math.floor(10000 + Math.random() * 90000)}`;
      const roomPassword = `pass${Math.floor(100 + Math.random() * 900)}`;
      
      // Criar a partida
      match = {
        id: matchId,
        title: `Partida ${mode.charAt(0).toUpperCase() + mode.slice(1)} #${Math.floor(10000 + Math.random() * 90000)}`,
        mode,
        type,
        status: 'waiting_players',
        teamSize,
        platform,
        platformMode: platformMode || 'mixed',
        gameplayMode: gameplayMode || 'normal',
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
      
      // Salvar a partida no banco
      await db.collection('matches').insertOne(match);
    }
    // Se não houver jogadores na fila nem salas oficiais, adicionar à fila
    else {
      // Adicionar o jogador à fila de matchmaking
      await matchmakingQueue.insertOne({
        userId,
        mode,
        type,
        platform,
        teamSize,
        platformMode: platformMode || 'mixed',
        gameplayMode: gameplayMode || 'normal',
        status: 'waiting',
        createdAt: new Date()
      });
      
      // Criar a partida temporária
      match = {
        id: `waiting-${Date.now()}`,
        title: `Aguardando partida ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
        mode,
        type,
        status: 'waiting',
        teamSize,
        platform,
        platformMode: platformMode || 'mixed',
        gameplayMode: gameplayMode || 'normal',
        entryFee: 10,
        prize: 18,
        odd: 1.8,
        teams: [
          {
            id: 'team1',
            name: 'Seu Time',
            players: [{
              id: userId,
              name: 'Você',
              isReady: true,
              isCaptain: true,
              team: 'team1'
            }]
          },
          {
            id: 'team2',
            name: 'Adversários',
            players: []
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentOption: 'split',
        createdBy: 'system',
        waitingForMatch: true // Sinalizar que o usuário está na fila
      };
    }

    // Retornar a partida
    return res.status(200).json(match);
  } catch (error) {
    console.error('Erro no matchmaking:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
} 