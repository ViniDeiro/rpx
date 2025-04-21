/**
 * Script para testar o sistema de notificações de convites para lobby
 * 
 * Este script permite:
 * 1. Criar um convite manualmente para um usuário específico
 * 2. Verificar se a notificação foi criada no banco de dados
 * 3. Listar todas as notificações pendentes para um usuário
 * 
 * Como usar:
 * - Para criar um convite: node test-lobby-invite.js create <lobbyId> <userId> <recipientId>
 * - Para listar convites de um usuário: node test-lobby-invite.js list <userId>
 * - Para verificar notificações: node test-lobby-invite.js check <userId>
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

// Conexão com o banco de dados
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log('Conectado ao MongoDB com sucesso');
    return client.db();
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
}

// Criar um convite de lobby manualmente
async function createLobbyInvite(lobbyId, userId, recipientId) {
  const db = await connectDB();
  
  try {
    // 1. Verificar se o lobby existe
    const lobby = await db.collection('lobbies').findOne({ _id: new ObjectId(lobbyId) });
    if (!lobby) {
      console.error('Erro: Lobby não encontrado');
      return;
    }
    
    // 2. Verificar se os usuários existem
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      console.error('Erro: Usuário convidador não encontrado');
      return;
    }
    
    const recipient = await db.collection('users').findOne({ _id: new ObjectId(recipientId) });
    if (!recipient) {
      console.error('Erro: Usuário convidado não encontrado');
      return;
    }
    
    // 3. Verificar se já existe um convite pendente
    const existingInvite = await db.collection('lobbyinvites').findOne({
      lobbyId: new ObjectId(lobbyId),
      recipient: new ObjectId(recipientId),
      status: 'pending'
    });
    
    if (existingInvite) {
      console.log('Já existe um convite pendente para este usuário neste lobby');
      console.log('ID do convite:', existingInvite._id.toString());
      return;
    }
    
    // 4. Criar o convite
    const now = new Date();
    const inviteResult = await db.collection('lobbyinvites').insertOne({
      lobbyId: new ObjectId(lobbyId),
      inviter: new ObjectId(userId),
      recipient: new ObjectId(recipientId),
      status: 'pending',
      createdAt: now
    });
    
    console.log('Convite criado com sucesso!');
    console.log('ID do convite:', inviteResult.insertedId.toString());
    
    // 5. Criar a notificação
    const notification = {
      userId: recipientId.toString(),
      type: 'lobby_invite',
      read: false,
      data: {
        inviter: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar || '/images/avatars/default.png'
        },
        invite: {
          _id: inviteResult.insertedId,
          lobbyId: lobbyId,
          status: 'pending',
          createdAt: now
        }
      },
      createdAt: now
    };
    
    const notifResult = await db.collection('notifications').insertOne(notification);
    
    console.log('Notificação criada com sucesso!');
    console.log('ID da notificação:', notifResult.insertedId.toString());
    
  } catch (error) {
    console.error('Erro ao criar convite:', error);
  } finally {
    await client.close();
  }
}

// Listar todos os convites pendentes para um usuário
async function listPendingInvites(userId) {
  const db = await connectDB();
  
  try {
    const invites = await db.collection('lobbyinvites')
      .find({ 
        recipient: new ObjectId(userId), 
        status: 'pending' 
      })
      .toArray();
    
    console.log(`Encontrados ${invites.length} convites pendentes para o usuário:`);
    
    for (const invite of invites) {
      // Buscar informações do lobby
      const lobby = await db.collection('lobbies').findOne({ _id: invite.lobbyId });
      
      // Buscar informações do convidador
      const inviter = await db.collection('users').findOne({ _id: invite.inviter });
      
      console.log('-----------------------------------');
      console.log(`ID do convite: ${invite._id}`);
      console.log(`Lobby: ${lobby?.name || 'Desconhecido'} (${invite.lobbyId})`);
      console.log(`Convidador: ${inviter?.username || 'Desconhecido'} (${invite.inviter})`);
      console.log(`Criado em: ${invite.createdAt}`);
      console.log(`Status: ${invite.status}`);
    }
    
    if (invites.length === 0) {
      console.log('Nenhum convite pendente encontrado.');
    }
    
  } catch (error) {
    console.error('Erro ao listar convites:', error);
  } finally {
    await client.close();
  }
}

// Verificar todas as notificações de um usuário
async function checkNotifications(userId) {
  const db = await connectDB();
  
  try {
    // Buscar notificações na coleção de notificações
    const notifications = await db.collection('notifications')
      .find({ userId: userId.toString() })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    console.log(`Encontradas ${notifications.length} notificações para o usuário:`);
    
    for (const notif of notifications) {
      console.log('-----------------------------------');
      console.log(`ID: ${notif._id}`);
      console.log(`Tipo: ${notif.type}`);
      console.log(`Lida: ${notif.read ? 'Sim' : 'Não'}`);
      console.log(`Criada em: ${notif.createdAt}`);
      
      if (notif.type === 'lobby_invite') {
        const inviterData = notif.data?.inviter;
        const inviteData = notif.data?.invite;
        
        if (inviterData) {
          console.log(`Convidador: ${inviterData.username || 'Desconhecido'} (${inviterData._id})`);
        }
        
        if (inviteData) {
          console.log(`ID do convite: ${inviteData._id}`);
          console.log(`ID do lobby: ${inviteData.lobbyId}`);
          console.log(`Status: ${inviteData.status}`);
        }
      }
      
      console.log('Dados completos:', JSON.stringify(notif.data, null, 2));
    }
    
    if (notifications.length === 0) {
      console.log('Nenhuma notificação encontrada.');
    }
    
  } catch (error) {
    console.error('Erro ao verificar notificações:', error);
  } finally {
    await client.close();
  }
}

// Função principal que processa os argumentos da linha de comando
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log('Uso: node test-lobby-invite.js <comando> [argumentos]');
    console.log('Comandos disponíveis:');
    console.log('  create <lobbyId> <userId> <recipientId> - Criar um convite de lobby');
    console.log('  list <userId> - Listar convites pendentes para um usuário');
    console.log('  check <userId> - Verificar notificações de um usuário');
    return;
  }
  
  switch (command) {
    case 'create':
      if (args.length !== 4) {
        console.log('Uso: node test-lobby-invite.js create <lobbyId> <userId> <recipientId>');
        return;
      }
      await createLobbyInvite(args[1], args[2], args[3]);
      break;
      
    case 'list':
      if (args.length !== 2) {
        console.log('Uso: node test-lobby-invite.js list <userId>');
        return;
      }
      await listPendingInvites(args[1]);
      break;
      
    case 'check':
      if (args.length !== 2) {
        console.log('Uso: node test-lobby-invite.js check <userId>');
        return;
      }
      await checkNotifications(args[1]);
      break;
      
    default:
      console.log(`Comando desconhecido: ${command}`);
      console.log('Use node test-lobby-invite.js para ver a lista de comandos');
  }
}

// Executar a função principal
main().catch(console.error); 