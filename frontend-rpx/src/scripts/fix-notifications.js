/**
 * Script para diagnosticar e corrigir problemas no sistema de notificações
 * 
 * Este script verificará e corrigirá:
 * 1. Formatos inconsistentes de IDs (ObjectId vs String)
 * 2. Convites de lobby sem notificações associadas
 * 3. Notificações para convites inexistentes 
 * 
 * Use: node src/scripts/fix-notifications.js
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado ao MongoDB com sucesso');
    
    const db = client.db();
    
    console.log('\n🔎 1. VERIFICANDO PROBLEMAS DE FORMATO DE ID...');
    
    // 1. Verificar e corrigir formatos inconsistentes de IDs em notificações
    const notifications = await db.collection('notifications').find().toArray();
    console.log(`Total de notificações: ${notifications.length}`);
    
    let idTypeFixCount = 0;
    
    for (const notification of notifications) {
      // Verificar se userId é um ObjectId
      if (typeof notification.userId === 'object') {
        console.log(`⚠️ Encontrada notificação ${notification._id} com userId como ObjectId`);
        
        // Corrigir para string
        await db.collection('notifications').updateOne(
          { _id: notification._id },
          { $set: { userId: notification.userId.toString() } }
        );
        
        console.log(`✅ Corrigido userId para string: ${notification.userId.toString()}`);
        idTypeFixCount++;
      }
    }
    
    console.log(`🔧 Corrigidos ${idTypeFixCount} problemas de tipo de ID em notificações\n`);
    
    // 2. Verificar se há convites sem notificações associadas
    console.log('\n🔎 2. VERIFICANDO CONVITES SEM NOTIFICAÇÕES...');
    
    const pendingInvites = await db.collection('lobbyinvites')
      .find({ status: 'pending' })
      .toArray();
    
    console.log(`Total de convites pendentes: ${pendingInvites.length}`);
    
    let createdNotifications = 0;
    
    for (const invite of pendingInvites) {
      const recipientId = typeof invite.recipient === 'object' 
        ? invite.recipient.toString() 
        : invite.recipient;
      
      const inviterId = typeof invite.inviter === 'object'
        ? invite.inviter.toString()
        : invite.inviter;
      
      // Verificar se existe notificação para este convite
      const notificationCount = await db.collection('notifications').countDocuments({
        $or: [
          { 'data.invite._id': invite._id.toString() },
          { 'data.invite._id': invite._id }
        ]
      });
      
      if (notificationCount === 0) {
        console.log(`⚠️ Convite ${invite._id} sem notificação. Criando...`);
        
        try {
          // Buscar dados do usuário que enviou o convite
          const inviter = await db.collection('users').findOne(
            { _id: new ObjectId(inviterId) },
            { projection: { _id: 1, username: 1, avatar: 1 } }
          );
          
          // Criar notificação
          const notification = {
            userId: recipientId,
            type: 'lobby_invite',
            read: false,
            data: {
              inviter: inviter || { _id: inviterId, username: 'Usuário' },
              invite: {
                _id: invite._id,
                lobbyId: invite.lobbyId,
                status: 'pending',
                createdAt: invite.createdAt || new Date()
              }
            },
            createdAt: new Date()
          };
          
          const result = await db.collection('notifications').insertOne(notification);
          console.log(`✅ Notificação criada com ID: ${result.insertedId}`);
          createdNotifications++;
        } catch (error) {
          console.error(`❌ Erro ao criar notificação para convite ${invite._id}:`, error);
        }
      }
    }
    
    console.log(`🔔 Criadas ${createdNotifications} notificações para convites sem notificação\n`);
    
    // 3. Verificar notificações para convites não existentes ou não pendentes
    console.log('\n🔎 3. VERIFICANDO NOTIFICAÇÕES PARA CONVITES INEXISTENTES...');
    
    const lobbyInviteNotifications = await db.collection('notifications')
      .find({ type: 'lobby_invite', read: false })
      .toArray();
    
    console.log(`Total de notificações de convite não lidas: ${lobbyInviteNotifications.length}`);
    
    let fixedOrphanedNotifications = 0;
    
    for (const notification of lobbyInviteNotifications) {
      const inviteId = notification.data?.invite?._id;
      
      if (!inviteId) {
        console.log(`⚠️ Notificação ${notification._id} sem ID de convite válido`);
        continue;
      }
      
      try {
        // Verificar se o convite existe
        const invite = await db.collection('lobbyinvites').findOne({
          _id: typeof inviteId === 'string' ? new ObjectId(inviteId) : inviteId
        });
        
        if (!invite) {
          console.log(`⚠️ Notificação ${notification._id} referencia convite inexistente ${inviteId}`);
          
          // Marcar como lida para que não apareça mais
          await db.collection('notifications').updateOne(
            { _id: notification._id },
            { $set: { read: true } }
          );
          
          console.log(`✅ Notificação marcada como lida: ${notification._id}`);
          fixedOrphanedNotifications++;
        } else if (invite.status !== 'pending') {
          console.log(`⚠️ Notificação ${notification._id} referencia convite não-pendente: ${invite.status}`);
          
          // Marcar como lida para que não apareça mais
          await db.collection('notifications').updateOne(
            { _id: notification._id },
            { $set: { read: true } }
          );
          
          console.log(`✅ Notificação marcada como lida: ${notification._id}`);
          fixedOrphanedNotifications++;
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar convite para notificação ${notification._id}:`, error);
      }
    }
    
    console.log(`🧹 Resolvidas ${fixedOrphanedNotifications} notificações órfãs\n`);
    
    // Resumo das correções
    console.log('\n📋 RESUMO DAS CORREÇÕES:');
    console.log(`- Corrigidos ${idTypeFixCount} problemas de tipo de ID em notificações`);
    console.log(`- Criadas ${createdNotifications} notificações para convites sem notificação`);
    console.log(`- Resolvidas ${fixedOrphanedNotifications} notificações órfãs\n`);
    
    if (idTypeFixCount + createdNotifications + fixedOrphanedNotifications > 0) {
      console.log('✅ Correções realizadas com sucesso! Teste o sistema novamente.');
    } else {
      console.log('ℹ️ Nenhum problema encontrado que precisasse de correção.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a execução do script:', error);
  } finally {
    await client.close();
    console.log('👋 Conexão com o MongoDB fechada');
  }
}

main().catch(console.error); 