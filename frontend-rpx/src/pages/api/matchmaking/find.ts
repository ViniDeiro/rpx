import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

// Dados simulados para jogadores online
const getRandomUsername = () => {
  const nomes = ['Gabriel', 'Lucas', 'Pedro', 'Rafael', 'Matheus', 'João', 'Bruno', 'Carlos', 'Felipe', 'Victor'];
  const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Ferreira', 'Rodrigues', 'Almeida', 'Gomes'];
  return `${nomes[Math.floor(Math.random() * nomes.length)]}${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
};

const getRandomAvatar = () => {
  const avatarId = Math.floor(Math.random() * 12) + 1;
  return `/images/avatars/avatar${avatarId}.png`;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // apenas aceitar requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // extrair parâmetros da requisição
    const { userId, mode, type, platform, platformMode, gameplayMode, teamSize } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Simulação: 70% de chance de encontrar uma partida
    const foundMatch = Math.random() < 0.7;
    
    let match;
    
    if (foundMatch) {
      console.log(`🎉 MATCH SIMULADO ENCONTRADO!`);
      
      // gerar ID único
      const matchId = `match-${Date.now()}-${uuidv4().substring(0, 8)}`;
      
      // Simular informações do usuário
      const userInfo = {
        id: userId,
        username: 'Você',
        avatar: '/images/avatars/default.png'
      };
      
      // Simular informações do outro jogador
      const otherPlayer = {
        userId: `user-${uuidv4().substring(0, 8)}`,
        username: getRandomUsername(),
        avatar: getRandomAvatar()
      };
      
      // montar times
      const team1 = {
        id: 'team1',
        name: 'Time 1',
        players: [{
          id: userId,
          name: userInfo.username,
          avatar: userInfo.avatar,
          isReady: true,
          isCaptain: true,
          team: 'team1'
        }]
      };
      
      const team2 = {
        id: 'team2',
        name: 'Time 2',
        players: [{
          id: otherPlayer.userId,
          name: otherPlayer.username,
          avatar: otherPlayer.avatar,
          isReady: true,
          isCaptain: true,
          team: 'team2'
        }]
      };
      
      // Criar a partida simulada
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
        roomId: `RPX${Math.floor(10000 + Math.random() * 90000)}`,
        roomPassword: `pass${Math.floor(100 + Math.random() * 900)}`
      };
      
      console.log(`✅ Partida simulada criada com sucesso: ${matchId}`);
      
    } else {
      console.log(`⏳ Simulação: Não há jogadores compatíveis. Aguardando...`);
      
      const matchId = `waiting-${Date.now()}-${uuidv4().substring(0, 8)}`;
      
      // Simular informações do usuário
      const userInfo = {
        id: userId,
        username: 'Você',
        avatar: '/images/avatars/default.png'
      };
      
      match = {
        id: matchId,
        title: `Aguardando Partida #${Math.floor(10000 + Math.random() * 90000)}`,
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
              name: userInfo.username,
              avatar: userInfo.avatar,
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
        waitingForMatch: true
      };
      
      console.log(`✅ Partida temporária simulada criada com sucesso: ${matchId}`);
    }
    
    // Adicionar um pequeno atraso artificial para simular processamento do servidor
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return res.status(200).json(match);
  } catch (error) {
    console.error('Erro no matchmaking simulado:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
} 