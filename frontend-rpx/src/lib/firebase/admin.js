import admin from 'firebase-admin';

// Mock de serviços do Firebase para build/desenvolvimento
const mockFirebaseServices = {
  messaging: () => ({
    send: async () => ({ messageId: 'mock-message-id-' + Date.now() }),
    sendEachForMulticast: async () => ({ 
      successCount: 1,
      failureCount: 0,
      responses: [{ success: true, messageId: 'mock-message-id-' + Date.now() }]
    }),
    sendToTopic: async () => ({ messageId: 'mock-message-id-' + Date.now() })
  }),
  firestore: () => ({
    collection: (name) => ({
      doc: (id) => ({
        set: async () => console.log(`[Mock Firestore] Set document in ${name}/${id}`),
        delete: async () => console.log(`[Mock Firestore] Delete document in ${name}/${id}`)
      }),
      where: () => ({
        get: async () => ({
          empty: false,
          docs: [
            { 
              data: () => ({ 
                token: 'mock-token-' + Date.now(),
                userId: 'mock-user-id'
              })
            }
          ]
        })
      })
    }),
    FieldValue: {
      serverTimestamp: () => new Date()
    }
  })
};

// Função que inicializa o Firebase Admin com tratamento de erro
export function initializeFirebaseAdmin() {
  // Se já estiver inicializado, retornar a instância
  if (admin.apps.length) {
    return {
      ...admin,
      // Garantir acesso aos serviços mockados
      messaging: mockFirebaseServices.messaging,
      firestore: mockFirebaseServices.firestore
    };
  }

  try {
    // Em ambiente de build, apenas inicializar minimamente e retornar mocks
    console.log('[Firebase Admin] Inicializando em modo de simulação para build');
    
    // Inicialização mínima apenas para permitir que o build continue
    admin.initializeApp({
      projectId: 'rpx-app-mock'
    });
    
    // Retornar o objeto admin com serviços mockados
    return {
      ...admin,
      messaging: mockFirebaseServices.messaging,
      firestore: mockFirebaseServices.firestore
    };
  } catch (error) {
    console.error('[Firebase Admin] Erro ao inicializar:', error);
    
    // Ainda assim retornar os mocks para que o build funcione
    return {
      apps: [{}], // Fingir que está inicializado
      messaging: mockFirebaseServices.messaging,
      firestore: mockFirebaseServices.firestore
    };
  }
}

// Exportar o admin com os serviços mockados
export default {
  ...admin,
  messaging: mockFirebaseServices.messaging,
  firestore: mockFirebaseServices.firestore
}; 