import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Interfaces para tipagem
interface Player {
  userId: string;
  username?: string;
  avatar?: string;
  lobbyId?: string;
}

interface UserInfo {
  _id: ObjectId | string;
  id?: string;
  userId?: string;
  username?: string;
  avatar?: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  isReady: boolean;
  isCaptain: boolean;
}

interface Team {
  id: string;
  name: string;
  players: PlayerInfo[];
}

interface Match {
  _id: ObjectId;
  id?: string;
  matchId?: string;
  status?: string;
  players?: Player[];
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Pegar o ID da partida dos parâmetros da URL
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID da partida é obrigatório' });
  }

  try {
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      console.log(`Buscando partida com ID: ${id}`);
      
      // Buscar partida pelo ID, tentando várias formas possíveis
      const matchIdStr = Array.isArray(id) ? id[0] : id.toString();
      
      const query: any = {
        $or: [
          { matchId: matchIdStr }
        ]
      };
      
      // Adicionar ObjectID apenas se for um ObjectID válido
      if (ObjectId.isValid(matchIdStr)) {
        query.$or.unshift({ _id: new ObjectId(matchIdStr) });
      }
      
      // Adicionar busca por id string
      query.$or.push({ id: matchIdStr });
      
      const match = await db.collection('matches').findOne<Match>(query);

      if (!match) {
        console.log(`Partida com ID ${matchIdStr} não encontrada`);
        return res.status(404).json({ error: 'Partida não encontrada' });
      }

      console.log(`Partida encontrada: ${JSON.stringify(match, null, 2)}`);
      
      // Buscar informações detalhadas dos jogadores
      const playerIds = match.players ? match.players.map((player: Player) => player.userId) : [];
      let playersInfo: UserInfo[] = [];
      
      if (playerIds.length > 0) {
        // Converter IDs válidos para ObjectId
        const objectIdPlayerIds = playerIds
          .filter((id: string) => ObjectId.isValid(id.toString()))
          .map((id: string) => new ObjectId(id.toString()));
        
        // IDs que não são ObjectId válidos
        const stringPlayerIds = playerIds.filter((id: string) => !ObjectId.isValid(id.toString()));
        
        // Consulta para buscar jogadores com ambos os tipos de ID
        const userQuery: any = {
          $or: []
        };
        
        if (objectIdPlayerIds.length > 0) {
          userQuery.$or.push({ _id: { $in: objectIdPlayerIds } });
        }
        
        if (stringPlayerIds.length > 0) {
          userQuery.$or.push({ id: { $in: stringPlayerIds } });
          userQuery.$or.push({ userId: { $in: stringPlayerIds } });
        }
        
        if (userQuery.$or.length > 0) {
          console.log(`Buscando jogadores com query: ${JSON.stringify(userQuery)}`);
          playersInfo = await db.collection('users').find<UserInfo>(userQuery).toArray();
          console.log(`Encontrados ${playersInfo.length} jogadores`);
        }
      }
      
      // Preparar times para a interface
      const team1: Team = { id: '1', name: 'Time 1', players: [] };
      const team2: Team = { id: '2', name: 'Time 2', players: [] };
      
      // Adicionar jogadores aos times
      if (match.players && match.players.length > 0) {
        match.players.forEach((player: Player, index: number) => {
          const userInfo = playersInfo.find(
            (p) => {
              const pId = p._id instanceof ObjectId ? p._id.toString() : p._id;
              return pId === player.userId || 
                   p.id === player.userId || 
                   p.userId === player.userId;
            }
          ) || {} as UserInfo;
          
          const playerInfo: PlayerInfo = {
            id: player.userId,
            name: userInfo.username || player.username || `Jogador ${index + 1}`,
            avatar: userInfo.avatar || player.avatar || '/images/avatars/default.png',
            isReady: false,
            isCaptain: index === 0 // Primeiro jogador é o capitão para simplificar
          };
          
          // Distribuir jogadores para os times
          if (index % 2 === 0) {
            team1.players.push(playerInfo);
          } else {
            team2.players.push(playerInfo);
          }
        });
      }
      
      // Montar o objeto final com as informações da partida
      const enrichedMatch = {
        ...match,
        id: match._id.toString(),
        teams: [team1, team2],
        status: match.status || 'waiting_players'
      };

      return res.status(200).json(enrichedMatch);
    }

    // Método não permitido
    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro ao processar solicitação de partida:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
} 