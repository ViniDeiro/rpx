// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Inicializar o Firebase
firebase.initializeApp({
  apiKey: '', // Será substituído pelo valor da variável de ambiente durante a build
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
});

// Inicializar Firebase Messaging
const messaging = firebase.messaging();

// Configuração para notificações em background
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Recebida mensagem em background ', payload);
  
  const notificationTitle = payload.notification.title || 'RPX';
  const notificationOptions = {
    body: payload.notification.body || 'Você recebeu uma nova notificação',
    icon: '/icons/logo192.png',
    badge: '/icons/badge.png',
    data: payload.data || {},
    vibrate: [100, 50, 100]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Lidar com cliques em notificações (abrir página específica)
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notificação clicada ', event);
  
  event.notification.close();
  
  // Verificar se há um link para abrir na notificação
  const action = event.action;
  const notification = event.notification;
  let url = self.location.origin;
  
  // Se tiver um link específico nos dados da notificação, usar ele
  if (notification.data && notification.data.url) {
    url = notification.data.url;
  } 
  // Se for uma ação específica
  else if (action === 'open_match' && notification.data && notification.data.matchId) {
    url = `${self.location.origin}/match/${notification.data.matchId}`;
  }
  
  // Abrir/focar na janela existente se já estiver aberta
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then(function(clientList) {
      // Verificar se já há uma janela/aba aberta com a URL
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === url && 'focus' in client)
          return client.focus();
      }
      // Se não houver, abrir nova janela/aba
      if (clients.openWindow)
        return clients.openWindow(url);
    })
  );
}); 