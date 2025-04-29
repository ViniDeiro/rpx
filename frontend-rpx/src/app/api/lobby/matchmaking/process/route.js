import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Chave de API para segurança
const API_KEY = process.env.MATCHMAKING_API_KEY || 'rpx-matchmaking-secret';

/**
 * API para processar a fila de matchmaking e criar partidas
 * Este endpoint deve ser chamado periodicamente (via cron job ou webhook)
 */
export async function POST(request) {
  try {
    // Verificar autenticação por API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    console.log('🎮 Processando fila de matchmaking...');
    
    // Obter todos os lobbies na fila
    const queueItems = await db.collection('matchmaking_queue')
      .find({ 
        processed: { $ne: true } // Apenas lobbies não processados
      })
      .sort({ createdAt: 1 }) // Mais antigos primeiro
      .toArray();
    
    if (queueItems.length === 0) {
      return NextResponse.json({ 
        status: 'success', 
        message: 'Nenhum lobby na fila de matchmaking',
        matches
      });
    }
    
    console.log(`🔍 Encontrados ${queueItems.length} lobbies na fila de matchmaking`);
    
    // Agrupar lobbies por tipo de jogo e tamanho
    const lobbiesByType = {};
    
    for (const item of queueItems) {
      // Chave composta por tipo + plataforma + região + modo
      const key = `${item.type || 'any'}-${item.platformMode || 'any'}-${item.region || 'any'}-${item.gameplayMode || 'normal'}`;
      
      if (!lobbiesByType[key]) {
        lobbiesByType[key] = [];
      }
      
      lobbiesByType[key].push(item);
    }
    
    // Resultado do matchmaking
    const matches = [];
    const processedLobbies = [];
    
    // Processar cada grupo de lobbies
    for (const [key, lobbies] of Object.entries(lobbiesByType)) {
      console.log(`⚙️ Processando ${lobbies.length} lobbies do tipo ${key}`);
      
      // Continuar processando enquanto houver pelo menos 2 lobbies disponíveis
      while (lobbies.length >= 2) {
        // Obter os dois primeiros lobbies (FIFO)
        const lobby1 = lobbies.shift();
        const lobby2 = lobbies.shift();
        
        if (!lobby1 || !lobby2) break;
        
        // Verificar se os lobbies ainda não foram processados
        if (processedLobbies.includes(lobby1.lobbyId) || processedLobbies.includes(lobby2.lobbyId)) {
          continue;
        }
        
        console.log(`✅ Match encontrado: ${lobby1.lobbyId} x ${lobby2.lobbyId}`);
        
        // Criar ID único para a partida
        const matchId = new ObjectId();
        
        // Criar o objeto da partida
        const matchData = {
          _id: matchId,
          matchId: matchId.toString(),
          status: 'pending', // pending, active, completed, canceled
          lobbies: [lobby1.lobbyId, lobby2.lobbyId],
          players: [...(lobby1.players || []), ...(lobby2.players || [])],
          teams: [
            { lobbyId: lobby1.lobbyId, players: lobby1.players || [] },
            { lobbyId: lobby2.lobbyId, players: lobby2.players || [] }
          ],
          type: lobby1.type,
          platformMode: lobby1.platformMode,
          gameplayMode: lobby1.gameplayMode,
          region: lobby1.region,
          createdAt: new Date(),
          startTime: null,
          endTime: null,
          winner: null
        };
        
        // Inserir a nova partida
        await db.collection('matches').insertOne(matchData);
        
        // Marcar lobbies como processados
        await db.collection('matchmaking_queue').updateMany(
          { lobbyId: { $in: [lobby1.lobbyId, lobby2.lobbyId] } },
          { $set: { matchId: matchId.toString() } }
        );
        
        // Atualizar o status dos lobbies
        for (const lobbyId of [lobby1.lobbyId, lobby2.lobbyId]) {
          await db.collection('lobbies').updateOne(
            { _id: new ObjectId(lobbyId) },
            { 
              $set: { 
                status: 'match_found',
                matchId: matchId.toString(),
                matchFoundAt: new Date()
              }
            }
          );
          
          // Notificar membros do lobby
          const lobby = await db.collection('lobbies').findOne({ _id: new ObjectId(lobbyId) });
          
          if (lobby && lobby.members) {
            for (const memberId of lobby.members) {
              await db.collection('notifications').insertOne({
                userId: memberId === 'object' ? memberId.toString() : memberId,
                type: 'system',
                read: false,
                title: 'Partida encontrada!',
                message: 'Uma partida foi encontrada para o seu lobby. Prepare-se para o jogo!',
                data: {
                  matchId: matchId.toString(),
                  type: 'match_found'
                },
                createdAt: new Date()
              });
            }
          }
        }
        
        // Adicionar à lista de matches encontrados
        matches.push({
          matchId: matchId.toString(),
          lobbies: [lobby1.lobbyId, lobby2.lobbyId],
          type: lobby1.type,
          createdAt: new Date()
        });
        
        // Marcar como processados
        processedLobbies.push(lobby1.lobbyId);
        processedLobbies.push(lobby2.lobbyId);
      }
    }
    
    return NextResponse.json({
      status: 'success',
      message: `Processamento concluído. ${matches.length} partidas criadas.`,
      matches
    });
    
  } catch (error) {
    console.error('Erro ao processar fila de matchmaking:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao processar fila de matchmaking: ' + (error.message || 'Erro desconhecido')
    }, { status: 400 });
  }
} 