import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apenas aceitar requisições GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Extrair parâmetros da requisição
    const { userId, forceCheck } = req.query;
    
    // Registrar a requisição para debug
    console.log(`⚙️ Verificando status de matchmaking para usuário: ${userId}, forceCheck: ${forceCheck}`);

    if (!userId) {
      return res.status(400).json({ 
        error: 'ID do usuário é obrigatório',
        matchFound: false 
      });
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Definir a consulta para encontrar partidas ativas para o usuário
    const matchQuery = {
      $or: [
        { 'teams.players.id': userId },
        { 'teams.0.players.id': userId },
        { 'teams.1.players.id': userId },
      ],
      status: { $in: ['waiting_players', 'in_progress', 'waiting'] }
    };
    
    // Encontrar partidas que envolvem o usuário
    const activeMatch = await db.collection('matches').findOne(matchQuery);
    
    if (activeMatch) {
      console.log(`✅ Partida ativa encontrada para o usuário ${userId}: ${activeMatch.id}`);
      return res.status(200).json({
        matchFound: true,
        match: activeMatch
      });
    }
    
    // Verificar fila de matchmaking - usuário ainda está na fila ou acaba de encontrar uma partida?
    const queueEntry = await db.collection('matchmaking_queue').findOne({ userId });
    
    if (queueEntry) {
      console.log(`👀 Usuário ${userId} está na fila. Status: ${queueEntry.status}`);
      
      // Se o usuário tem uma partida associada (matched)
      if (queueEntry.status === 'matched' && queueEntry.matchId) {
        // Buscar detalhes da partida
        const match = await db.collection('matches').findOne({ id: queueEntry.matchId });
        
        if (match) {
          console.log(`🎮 Partida encontrada via fila: ${match.id}`);
          return res.status(200).json({
            matchFound: true,
            match: match,
            source: 'queue'
          });
        } else {
          console.log(`⚠️ Partida ${queueEntry.matchId} referenciada na fila não foi encontrada`);
        }
      }
      
      // Se o usuário tem uma partida temporária de espera
      if (queueEntry.waitingMatchId) {
        const tempMatch = await db.collection('matches').findOne({ id: queueEntry.waitingMatchId });
        
        if (tempMatch) {
          console.log(`⌛ Partida temporária encontrada: ${tempMatch.id}`);
          return res.status(200).json({
            matchFound: true,
            match: tempMatch,
            source: 'waiting'
          });
        }
      }
      
      // Calcular tempo de espera para informação
      const waitTime = Math.floor((Date.now() - new Date(queueEntry.createdAt).getTime()) / 1000);
      
      return res.status(200).json({
        matchFound: false,
        message: `Aguardando por ${waitTime}s`,
        waitTime,
        queueStatus: queueEntry.status,
        inQueue: true
      });
    }
    
    // Usuário não está na fila e não tem partidas ativas
    console.log(`ℹ️ Usuário ${userId} não está na fila nem em partidas ativas`);
    return res.status(200).json({ 
      matchFound: false,
      message: 'Não está na fila de matchmaking',
      inQueue: false
    });
    
  } catch (error) {
    console.error('Erro ao verificar status do matchmaking:', error);
    return res.status(500).json({ 
      error: 'Erro interno no servidor',
      matchFound: false
    });
  }
} 