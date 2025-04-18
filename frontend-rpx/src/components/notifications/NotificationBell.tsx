import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'react-feather';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import NotificationCenter from './NotificationCenter';
import { toast } from 'react-toastify';
import { PushNotificationService } from '@/services/push/pushNotificationService';

// Definir uma interface para notificações
interface Notification {
  _id: string;
  type: string;
  read: boolean;
  createdAt: string;
  [key: string]: any; // Para campos adicionais específicos de cada tipo
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const { data: session } = useSession();
  
  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      // Configurar polling para atualizar as notificações a cada 30 segundos
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);
  
  // Verificar se as notificações push estão habilitadas
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);
  
  const fetchNotifications = async () => {
    try {
      console.log('Buscando notificações...');
      const response = await axios.get('/api/notifications');
      console.log('Resposta API notificações:', response.data);
      
      if (response.data.status === 'success') {
        // Atualizar o contador de notificações não lidas
        const notificationsData = response.data.notifications || [];
        const notReadCount = notificationsData.filter((n: Notification) => !n.read).length;
        
        setNotifications(notificationsData);
        setUnreadCount(notReadCount);
        console.log(`Notificações carregadas: ${notificationsData.length}, não lidas: ${notReadCount}`);
      } else {
        console.error('Erro na resposta da API:', response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };
  
  const toggleNotificationCenter = () => {
    setIsOpen(!isOpen);
    // Se estiver abrindo, buscar as notificações mais recentes
    if (!isOpen) {
      fetchNotifications();
    }
  };

  // Função para habilitar notificações push
  const enablePushNotifications = async () => {
    if (!session?.user?.id) {
      toast.error('Você precisa estar logado para habilitar notificações');
      return;
    }
    
    setPushLoading(true);
    
    try {
      // Inicializar serviço se necessário
      PushNotificationService.initialize();
      
      // Solicitar permissão
      const permission = await PushNotificationService.requestPermission();
      
      if (permission) {
        // Obter token
        const token = await PushNotificationService.getToken();
        
        if (token) {
          // Salvar token
          const success = await PushNotificationService.saveToken(
            session.user.id,
            token
          );
          
          if (success) {
            setPushEnabled(true);
            toast.success('Notificações push habilitadas com sucesso');
          }
        }
      } else {
        toast.warn('Permissão para notificações negada. Verifique as configurações do seu navegador.');
      }
    } catch (error) {
      console.error('Erro ao habilitar notificações push:', error);
      toast.error('Erro ao habilitar notificações push');
    } finally {
      setPushLoading(false);
    }
  };
  
  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {/* Botão para habilitar notificações push */}
        {session?.user && !pushEnabled && typeof window !== 'undefined' && 'Notification' in window && (
          <button
            onClick={enablePushNotifications}
            disabled={pushLoading}
            className="bg-gray-800 hover:bg-gray-700 text-white rounded-full px-3 py-2 text-sm shadow-lg flex items-center justify-center relative"
            aria-label="Ativar notificações push"
          >
            {pushLoading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : (
              <BellOff size={16} className="mr-2" />
            )}
            <span>Ativar notificações</span>
          </button>
        )}
        
        {/* Botão de notificações */}
        <button
          onClick={toggleNotificationCenter}
          className="bg-primary hover:bg-primary-dark text-white rounded-full p-3 shadow-lg flex items-center justify-center relative"
          aria-label="Notificações"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        onUpdate={fetchNotifications}
      />
    </>
  );
} 