import firebase from 'firebase/app';
import 'firebase/messaging';

/**
 * Interface para dados de notificação push
 */
interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  clickAction?: string;
  data?: {
    [key: string]: string;
  };
}

/**
 * Classe responsável pelo serviço de notificações push
 */
export class PushNotificationService {
  private static messaging: firebase.messaging.Messaging | null = null;
  private static isInitialized = false;
  private static vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

  /**
   * Inicializa o serviço de notificações push
   */
  static initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      // Verificar se o Firebase já foi inicializado
      if (!firebase.apps.length) {
        firebase.initializeApp({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        });
      }

      if ('Notification' in window && firebase.messaging.isSupported()) {
        this.messaging = firebase.messaging();
        this.isInitialized = true;
        console.log('Serviço de notificações push inicializado com sucesso');
      } else {
        console.log('Este navegador não suporta notificações push');
      }
    } catch (error) {
      console.error('Erro ao inicializar serviço de notificações push:', error);
    }
  }

  /**
   * Solicita permissão para enviar notificações push
   * @returns Promise<boolean> - Se o usuário concedeu permissão
   */
  static async requestPermission(): Promise<boolean> {
    if (!this.isInitialized) {
      this.initialize();
      if (!this.isInitialized) {
        console.error('Serviço de notificações push não inicializado');
        return false;
      }
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão para notificações:', error);
      return false;
    }
  }

  /**
   * Obtém o token do dispositivo para notificações push
   * @returns Promise<string | null> - Token do dispositivo ou null se falhar
   */
  static async getToken(): Promise<string | null> {
    if (!this.isInitialized || !this.messaging) {
      console.error('Serviço de notificações push não inicializado');
      return null;
    }

    try {
      // Verificar permissão
      const permission = await this.requestPermission();
      if (!permission) {
        console.log('Permissão para notificações negada pelo usuário');
        return null;
      }

      // Obter token
      const currentToken = await this.messaging.getToken({ vapidKey: this.vapidKey });
      if (currentToken) {
        return currentToken;
      } else {
        console.log('Não foi possível obter token. Solicite permissão para gerar um.');
        return null;
      }
    } catch (error) {
      console.error('Erro ao obter token de notificação:', error);
      return null;
    }
  }

  /**
   * Salva o token do dispositivo no banco de dados
   * @param userId ID do usuário
   * @param token Token do dispositivo
   * @returns Promise<boolean> - Se o token foi salvo com sucesso
   */
  static async saveToken(userId: string, token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/push-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, token }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao salvar token de notificação:', error);
      return false;
    }
  }

  /**
   * Configura os handlers para notificações push
   */
  static setupPushHandlers() {
    if (!this.isInitialized || !this.messaging) {
      console.error('Serviço de notificações push não inicializado');
      return;
    }

    // Handler para mensagens em primeiro plano
    this.messaging.onMessage((payload) => {
      console.log('Mensagem recebida em primeiro plano:', payload);
      
      // Criar notificação manualmente para mostrar em primeiro plano
      if (payload.notification) {
        const { title, body } = payload.notification;
        new Notification(title || 'RPX Platform', {
          body: body || 'Você recebeu uma nova notificação',
          icon: '/icons/logo192.png'
        });
      }
    });
  }

  /**
   * Envia uma notificação push para um usuário específico
   * @param token Token do dispositivo
   * @param notification Dados da notificação
   * @returns Promise<boolean> - Se a notificação foi enviada com sucesso
   */
  static async sendPushNotification(token: string, notification: PushNotificationData): Promise<boolean> {
    try {
      const response = await fetch('/api/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          notification
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar notificação push:', error);
      return false;
    }
  }
} 