/**
 * Script de depuração para o sistema de notificações
 * 
 * Este script pode ser executado com Node.js para verificar o estado 
 * das notificações e convites do sistema, identificando possíveis problemas.
 * 
 * Como usar:
 * 1. Certifique-se que tem as credenciais do MongoDB configuradas no .env
 * 2. Execute: node -r dotenv/config src/scripts/debug-notifications.js <userId>
 *    Onde <userId> é o ID do usuário para o qual deseja verificar notificações
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// URL de conexão do MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI não definido no .env. Por favor, configure-o.');
  process.exit(1);
}

// Obter ID do usuário dos argumentos da linha de comando
const userId = process.argv[2];
if (!userId) {
  console.error('Por favor, forneça um ID de usuário como argumento:');
  console.error('node -r dotenv/config src/scripts/debug-notifications.js <userId>');
  process.exit(1);
}

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return { client, db: client.db() };
}

async function main() {
  console.log('=== Ferramenta de Diagnóstico do Sistema de Notificações ===');
  console.log(`Analisando notificações para o usuário: ${userId}`);
  
  try {
    // Conectar ao banco de dados
    const { client, db } = await connectToDatabase();
    console.log('Conectado ao MongoDB com sucesso!\n');
    
    // Verificar formato do ID de usuário
    console.log('== Verificando formato do ID de usuário ==');
    try {
      const objId = new ObjectId(userId);
      console.log(`ID válido no formato ObjectId: ${objId}`);
    } catch (err) {
      console.log(`ID NÃO é um ObjectId válido!`);
    }
    
    // Verificar se o usuário existe
    const user = await db.collection('users').findOne({
      $or: [
        { _id: new ObjectId(userId) },
        { _id: userId }
      ]
    });
    
    if (!user) {
      console.error('Usuário não encontrado no banco de dados!');
      await client.close();
      process.exit(1);
    }
    
    console.log(`Usuário encontrado: ${user.username || 'Nome não disponível'}\n`);
    
    // 1. Verificar notificações na coleção notifications
    console.log('== Notificações na coleção "notifications" ==');
    const notifications = await db.collection('notifications').find({
      $or: [
        { userId: new ObjectId(userId) },
        { userId: userId.toString() }
      ]
    }).toArray();
    
    console.log(`Total de notificações: ${notifications.length}`);
    
    // Mostrar detalhes de cada notificação
    if (notifications.length > 0) {
      notifications.forEach((notification, index) => {
        console.log(`\n--- Notificação ${index + 1} ---`);
        console.log(`ID: ${notification._id}`);
        console.log(`Tipo: ${notification.type}`);
        console.log(`Lida: ${notification.read ? 'Sim' : 'Não'}`);
        console.log(`Criada em: ${notification.createdAt}`);
        console.log(`UserID formato: ${typeof notification.userId === 'object' ? 'ObjectId' : 'String'}`);
        
        if (notification.type === 'lobby_invite' && notification.data) {
          console.log('Dados do convite:');
          if (notification.data.inviter) {
            console.log(`- Convidador: ${notification.data.inviter.username || 'N/A'}`);
          }
          if (notification.data.invite) {
            console.log(`- ID do convite: ${notification.data.invite._id}`);
            console.log(`- ID do lobby: ${notification.data.invite.lobbyId}`);
          }
        }
      });
    }
    
    // 2. Verificar convites de lobby
    console.log('\n== Convites de lobby para o usuário ==');
    const lobbyInvites = await db.collection('lobbyinvites').find({
      $or: [
        { recipient: new ObjectId(userId) },
        { recipient: userId.toString() }
      ]
    }).toArray();
    
    console.log(`Total de convites de lobby: ${lobbyInvites.length}`);
    
    if (lobbyInvites.length > 0) {
      lobbyInvites.forEach((invite, index) => {
        console.log(`\n--- Convite ${index + 1} ---`);
        console.log(`ID: ${invite._id}`);
        console.log(`Status: ${invite.status}`);
        console.log(`ID do Lobby: ${invite.lobbyId}`);
        console.log(`Recipient formato: ${typeof invite.recipient === 'object' ? 'ObjectId' : 'String'}`);
        console.log(`Inviter formato: ${typeof invite.inviter === 'object' ? 'ObjectId' : 'String'}`);
        console.log(`Criado em: ${invite.createdAt}`);
      });
      
      // Verificar lobby IDs existentes
      const lobbyIds = lobbyInvites.map(invite => {
        try {
          return new ObjectId(invite.lobbyId);
        } catch (e) {
          return invite.lobbyId;
        }
      });
      
      const lobbies = await db.collection('lobbies').find({
        $or: [
          { _id: { $in: lobbyIds } },
          { _id: { $in: lobbyIds.map(id => id.toString()) } }
        ]
      }).toArray();
      
      console.log(`\nLobbies encontrados: ${lobbies.length} de ${lobbyIds.length} convites`);
    }
    
    // 3. Verificar convites enviados pelo usuário
    console.log('\n== Convites enviados pelo usuário ==');
    const sentInvites = await db.collection('lobbyinvites').find({
      $or: [
        { inviter: new ObjectId(userId) },
        { inviter: userId.toString() }
      ]
    }).toArray();
    
    console.log(`Total de convites enviados: ${sentInvites.length}`);
    
    if (sentInvites.length > 0) {
      sentInvites.forEach((invite, index) => {
        console.log(`\n--- Convite enviado ${index + 1} ---`);
        console.log(`ID: ${invite._id}`);
        console.log(`Status: ${invite.status}`);
        console.log(`ID do Lobby: ${invite.lobbyId}`);
        console.log(`Para: ${invite.recipient}`);
        console.log(`Criado em: ${invite.createdAt}`);
      });
    }
    
    // 4. Sugestões para corrigir problemas
    console.log('\n== Sugestões de correção ==');
    
    if (notifications.some(n => typeof n.userId === 'object')) {
      console.log('\n1. Corrigir formato de userId nas notificações:');
      console.log(`
// Converter todos os userId de ObjectId para string
db.notifications.updateMany(
  { userId: { $type: "objectId" } },
  [{ $set: { userId: { $toString: "$userId" } } }]
);`);
    }
    
    if (lobbyInvites.some(i => typeof i.recipient === 'object' || typeof i.inviter === 'object')) {
      console.log('\n2. Corrigir formato de recipient e inviter nos convites:');
      console.log(`
// Converter todos os recipient de ObjectId para string
db.lobbyinvites.updateMany(
  { recipient: { $type: "objectId" } },
  [{ $set: { recipient: { $toString: "$recipient" } } }]
);

// Converter todos os inviter de ObjectId para string
db.lobbyinvites.updateMany(
  { inviter: { $type: "objectId" } },
  [{ $set: { inviter: { $toString: "$inviter" } } }]
);`);
    }
    
    console.log('\n3. Verificar e corrigir código para sempre usar string para IDs de usuário:');
    console.log(`
- Certifique-se de que todas as inserções de notificações usem userId como string:
  userId: userId.toString()
  
- Use consultas que suportem ambos os formatos:
  $or: [
    { userId: new ObjectId(userId) },
    { userId: userId.toString() }
  ]`);
    
    // Fechar conexão
    await client.close();
    console.log('\nConexão com o banco de dados fechada.');
    
  } catch (error) {
    console.error('Erro ao executar diagnóstico:', error);
  }
}

// Executar o script
main().catch(console.error);

/**
 * Script para debug de notificações no lado do cliente
 * 
 * Copie e cole este script no console do navegador para:
 * 1. Verificar todas as notificações armazenadas no IndexedDB
 * 2. Forçar a verificação de novas notificações
 * 3. Visualizar o fluxo de notificações em tempo real
 * 4. Simular a recepção de uma notificação de convite para lobby
 */

// Namespace para evitar colisões
window.RPXDebug = window.RPXDebug || {};

// Funções de debug para notificações
window.RPXDebug.notifications = {
  // Verificar o serviço de notificações push
  checkPushService() {
    console.log('=== DEBUG: Serviço de Notificações Push ===');
    
    // Verificar se o Firebase está inicializado
    if (!window.firebase) {
      console.error('Firebase não está disponível. Verifique se o SDK foi carregado.');
      return;
    }
    
    // Verificar se o messaging está disponível
    if (!firebase.messaging) {
      console.error('Firebase Messaging não está disponível.');
      return;
    }
    
    // Verificar o service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log(`Service Workers registrados: ${registrations.length}`);
        registrations.forEach(reg => {
          console.log('- Escopo:', reg.scope);
          console.log('- Estado:', reg.active ? 'Ativo' : (reg.installing ? 'Instalando' : 'Aguardando'));
        });
      });
    } else {
      console.error('Service Worker não suportado neste navegador.');
    }
    
    // Verificar permissão de notificações
    if ('Notification' in window) {
      console.log('Permissão de notificações:', Notification.permission);
    } else {
      console.error('Notificações não suportadas neste navegador.');
    }
  },
  
  // Forçar a verificação de novas notificações
  async fetchNotifications() {
    console.log('=== DEBUG: Buscando notificações do servidor ===');
    
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      console.log(`Recebidas ${data.notifications?.length || 0} notificações, ${data.unreadCount || 0} não lidas.`);
      console.log('Notificações recebidas:', data.notifications);
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return null;
    }
  },
  
  // Simular a recepção de uma notificação de convite para lobby
  async simulateLobbyInvite() {
    console.log('=== DEBUG: Simulando notificação de convite para lobby ===');
    
    // Obter o componente NotificationBell
    const bellComponent = document.querySelector('[data-testid="notification-bell"]');
    if (!bellComponent) {
      console.error('Componente NotificationBell não encontrado na página.');
      console.log('Tentando buscar notificações manualmente...');
      
      // Tentar buscar as notificações manualmente
      const data = await this.fetchNotifications();
      if (data && data.notifications) {
        console.log('Notificações buscadas manualmente:');
        this.inspectNotifications(data.notifications);
      }
      
      return;
    }
    
    // Acessar o estado React do componente
    const reactInstance = Object.keys(bellComponent).find(key => 
      key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
    );
    
    if (!reactInstance) {
      console.error('Não foi possível acessar a instância React do componente.');
      return;
    }
    
    // Tentar obter o estado e funções do componente
    const internalInstance = bellComponent[reactInstance];
    const setNotifications = this._findReactMethod(internalInstance, 'setNotifications');
    const setUnreadCount = this._findReactMethod(internalInstance, 'setUnreadCount');
    const fetchNotifications = this._findReactMethod(internalInstance, 'fetchNotifications');
    
    if (fetchNotifications) {
      console.log('Chamando função fetchNotifications() do componente...');
      fetchNotifications();
      console.log('Função chamada com sucesso!');
    } else {
      console.error('Função fetchNotifications não encontrada no componente.');
    }
  },
  
  // Inspecionar notificações existentes
  inspectNotifications(notifications) {
    if (!notifications || !notifications.length) {
      console.log('Nenhuma notificação disponível para inspeção.');
      return;
    }
    
    console.log(`=== DEBUG: Inspecionando ${notifications.length} notificações ===`);
    
    // Filtrar convites de lobby
    const lobbyInvites = notifications.filter(n => 
      n.type === 'lobby_invite' || 
      (n.data && n.data.invite)
    );
    
    console.log(`Encontrados ${lobbyInvites.length} convites de lobby:`);
    
    lobbyInvites.forEach((invite, index) => {
      console.log(`\n--- Convite #${index + 1} ---`);
      console.log(`ID: ${invite._id}`);
      console.log(`Tipo: ${invite.type}`);
      console.log(`Lido: ${invite.read ? 'Sim' : 'Não'}`);
      console.log(`Status: ${invite.status || invite.data?.invite?.status || 'desconhecido'}`);
      console.log(`Data: ${new Date(invite.createdAt).toLocaleString()}`);
      
      // Informações do convidador
      const inviterName = invite.inviterName || 
                         invite.data?.inviter?.username || 
                         'Desconhecido';
      console.log(`Convidador: ${inviterName}`);
      
      // ID do lobby
      const lobbyId = invite.lobbyId || 
                     invite.data?.invite?.lobbyId || 
                     'Desconhecido';
      console.log(`ID do Lobby: ${lobbyId}`);
      
      // Exibir dados completos para depuração detalhada
      console.log('Dados completos:', invite);
    });
  },
  
  // Método auxiliar para encontrar métodos React
  _findReactMethod(instance, methodName) {
    if (!instance) return null;
    
    let fiber = instance;
    while (fiber) {
      const stateNode = fiber.stateNode;
      
      if (stateNode && typeof stateNode[methodName] === 'function') {
        return stateNode[methodName].bind(stateNode);
      }
      
      fiber = fiber.return;
    }
    
    return null;
  },
  
  // Interceptar requisições de API relacionadas a notificações
  interceptApiCalls() {
    console.log('=== DEBUG: Interceptando chamadas da API de notificações ===');
    
    const originalFetch = window.fetch;
    
    window.fetch = async function(url, options) {
      const response = await originalFetch(url, options);
      
      // Clone da resposta para não consumir o body original
      const clone = response.clone();
      
      // Verificar se é uma chamada relacionada a notificações
      if (url.toString().includes('/api/notifications') || 
          url.toString().includes('/api/lobby/invite')) {
        clone.json().then(data => {
          console.log(`Interceptada chamada para: ${url.toString()}`);
          console.log('Método:', options?.method || 'GET');
          console.log('Resposta:', data);
        }).catch(err => {
          // Ignorar erros ao ler o body (pode já ter sido consumido)
        });
      }
      
      return response;
    };
    
    console.log('Interceptação de API ativada. Todas as chamadas relacionadas a notificações serão registradas no console.');
  }
};

// Comando para iniciar a depuração completa
window.RPXDebug.startFullDebug = function() {
  console.clear();
  console.log('=== INICIANDO DEPURAÇÃO COMPLETA DE NOTIFICAÇÕES ===');
  
  // Verificar configuração de notificações push
  this.notifications.checkPushService();
  
  // Interceptar chamadas de API
  this.notifications.interceptApiCalls();
  
  // Buscar notificações existentes
  this.notifications.fetchNotifications().then(data => {
    if (data && data.notifications) {
      this.notifications.inspectNotifications(data.notifications);
    }
  });
  
  console.log('\n=== INSTRUÇÕES DE DEPURAÇÃO ===');
  console.log('1. Use RPXDebug.notifications.fetchNotifications() para buscar notificações manualmente');
  console.log('2. Use RPXDebug.notifications.simulateLobbyInvite() para simular atualização de notificações');
  console.log('3. Todas as chamadas relacionadas a notificações serão interceptadas e registradas');
  
  return 'Depuração de notificações iniciada com sucesso!';
};

// Iniciar automaticamente a depuração ao carregar o script
window.RPXDebug.startFullDebug(); 