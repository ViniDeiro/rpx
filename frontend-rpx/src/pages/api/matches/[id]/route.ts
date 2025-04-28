import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';

// Definindo interfaces para os tipos
interface Player {
  id?: string;
  userId?: string;
  name?: string;
  [key: string]: any;
}

interface Team {
  id: string;
  name: string;
  players?: Player[];
  [key: string]: any;
}

interface Match {
  id: string;
  status: string;
  teams?: Team[];
  playersInQueue?: string[];
  [key: string]: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'ID da partida é obrigatório' });
  }

  // Permitir apenas solicitações GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Buscar a partida pelo ID
    const matchDoc = await db.collection('matches').findOne({ id });
    
    if (!matchDoc) {
      console.log(`❌ Partida ${id} não encontrada`);
      return res.status(404).json({ error: 'Partida não encontrada' });
    }
    
    // Converter para o tipo Match
    const match = matchDoc as unknown as Match;
    
    console.log(`✅ Partida ${id} encontrada, status: ${match.status}`);
    
    // Verificar se os jogadores atualmente estão na fila (para o problema #5)
    if (match.teams && Array.isArray(match.teams)) {
      // Extrair IDs de todos os jogadores de todos os times
      const playerIds = match.teams.flatMap(team => 
        team.players?.map((player: Player) => player.id || player.userId) || []
      ).filter(Boolean);
      
      if (playerIds.length > 0) {
        // Verificar quais jogadores estão na fila
        const queueEntries = await db.collection('matchmaking_queue').find({
          userId: { $in: playerIds }
        }).toArray();
        
        const queuePlayerIds = queueEntries.map(entry => entry.userId);
        
        console.log(`👥 Jogadores na partida: ${playerIds.length}, na fila: ${queuePlayerIds.length}`);
        
        // Adicionar informação sobre quem está na fila
        match.playersInQueue = queuePlayerIds;
      }
    }
    
    // Retornar a partida com informações adicionais para debugging se necessário
    return res.status(200).json({
      match,
      timestamp: new Date().toISOString(),
      debug: {
        id: match.id,
        status: match.status,
        playerCount: match.teams?.reduce((acc: number, team: Team) => acc + (team.players?.length || 0), 0) || 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar partida:', error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
} 