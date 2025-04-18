/**
 * Script de depuração para o sistema de matchmaking
 * 
 * Este script pode ser executado com Node.js para verificar o estado 
 * das coleções relacionadas ao matchmaking e identificar problemas.
 * 
 * Como usar:
 * 1. Certifique-se que tem as credenciais do MongoDB configuradas no .env
 * 2. Execute: node -r dotenv/config src/scripts/debug-matchmaking.js
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// URL de conexão do MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI não definido no .env. Por favor, configure-o.');
  process.exit(1);
}

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db() };
}

async function main() {
  console.log('=== Ferramenta de Diagnóstico do Sistema de Matchmaking ===');
  
  try {
    // Conectar ao banco de dados
    const { client, db } = await connectToDatabase();
    console.log('Conectado ao MongoDB com sucesso!\n');
    
    // Verificar coleções relevantes
    console.log('== Verificando coleções ==');
    
    // 1. Verificar fila de matchmaking
    const queueCollection = db.collection('matchmaking_queue');
    const queueCount = await queueCollection.countDocuments();
    console.log(`Fila de matchmaking: ${queueCount} documentos`);
    
    if (queueCount > 0) {
      const recentQueue = await queueCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();
      
      console.log('\nDocumentos recentes na fila:');
      recentQueue.forEach((doc, index) => {
        console.log(`\n--- Documento ${index + 1} ---`);
        console.log(`ID: ${doc._id}`);
        console.log(`LobbyID: ${doc.lobbyId}`);
        console.log(`UserID: ${doc.userId || 'N/A'}`);
        console.log(`Modo: ${doc.mode || doc.gameType || 'N/A'}`);
        console.log(`Tipo: ${doc.type || 'N/A'}`);
        console.log(`Plataforma: ${doc.platform || doc.platformMode || 'N/A'}`);
        console.log(`Jogadores: ${doc.players ? doc.players.length : 0}`);
        console.log(`Criado em: ${doc.createdAt}`);
      });
    }
    
    // 2. Verificar partidas pendentes
    console.log('\n== Partidas pendentes ==');
    const pendingMatches = await db.collection('matches')
      .find({ status: { $in: ['pending', 'waiting_players'] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log(`Total de partidas pendentes: ${pendingMatches.length}`);
    
    if (pendingMatches.length > 0) {
      pendingMatches.forEach((match, index) => {
        console.log(`\n--- Partida ${index + 1} ---`);
        console.log(`ID: ${match._id || match.id || match.matchId}`);
        console.log(`Status: ${match.status}`);
        console.log(`Modo: ${match.mode || match.gameType || 'N/A'}`);
        console.log(`Tipo: ${match.type || 'N/A'}`);
        
        if (match.teams) {
          match.teams.forEach((team, teamIndex) => {
            console.log(`Time ${teamIndex + 1}: ${team.players ? team.players.length : 0} jogadores`);
          });
        } else if (match.players) {
          console.log(`Jogadores: ${match.players.length}`);
        }
        
        console.log(`Criado em: ${match.createdAt}`);
      });
    }
    
    // 3. Verificar lobbies em matchmaking
    console.log('\n== Lobbies em matchmaking ==');
    const matchmakingLobbies = await db.collection('lobbies')
      .find({ status: 'matchmaking' })
      .limit(5)
      .toArray();
    
    console.log(`Total de lobbies em matchmaking: ${matchmakingLobbies.length}`);
    
    if (matchmakingLobbies.length > 0) {
      matchmakingLobbies.forEach((lobby, index) => {
        console.log(`\n--- Lobby ${index + 1} ---`);
        console.log(`ID: ${lobby._id}`);
        console.log(`Dono: ${lobby.owner}`);
        console.log(`Membros: ${lobby.members ? lobby.members.length : 0}`);
        console.log(`Tipo de jogo: ${lobby.gameType || 'N/A'}`);
        console.log(`Começou matchmaking em: ${lobby.matchmakingStartedAt || 'N/A'}`);
      });
      
      // Verificar se há inconsistências: lobbies em matchmaking que não estão na fila
      const lobbyIds = matchmakingLobbies.map(l => l._id.toString());
      const queuedLobbyIds = await queueCollection
        .find({ lobbyId: { $in: lobbyIds } })
        .toArray()
        .then(items => items.map(i => i.lobbyId.toString()));
      
      const missingLobbies = lobbyIds.filter(id => !queuedLobbyIds.includes(id));
      
      if (missingLobbies.length > 0) {
        console.log('\n⚠️ INCONSISTÊNCIA DETECTADA ⚠️');
        console.log(`${missingLobbies.length} lobbies estão marcados como 'matchmaking' mas não estão na fila:`);
        console.log(missingLobbies.join(', '));
      }
    }
    
    // 4. Sugestões para corrigir problemas
    console.log('\n== Sugestões de correção ==');
    
    if (missingLobbies && missingLobbies.length > 0) {
      console.log(`
1. Restaurar lobbies inconsistentes:
   - Atualizar o status dos lobbies para 'active' novamente:
   db.lobbies.updateMany(
     { _id: { $in: [${missingLobbies.map(id => `ObjectId("${id}")`).join(', ')}] } },
     { $set: { status: 'active' } }
   );`);
    }
    
    console.log(`
2. Limpar fila de matchmaking:
   - Se houver problemas persistentes, você pode limpar a fila:
   db.matchmaking_queue.deleteMany({});
   
3. Verificar se os nomes das coleções estão corretos:
   - Certifique-se de que todos os endpoints estão usando 'matchmaking_queue'
   - Não use 'matchmakingQueue' em nenhum lugar

4. Certifique-se de que o processo de matchmaking está sendo executado regularmente:
   - Verifique se a rota /api/matchmaking/process está sendo chamada
   - Configure um cron job ou webhook para chamar essa rota a cada X minutos`);
    
    // Fechar conexão
    await client.close();
    console.log('\nConexão com o banco de dados fechada.');
    
  } catch (error) {
    console.error('Erro ao executar diagnóstico:', error);
  }
}

// Executar o script
main().catch(console.error); 