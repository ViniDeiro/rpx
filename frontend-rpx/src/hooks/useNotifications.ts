import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface NotificationData {
  inviter?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  invite?: {
    _id: string;
    lobbyId: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    createdAt: string;
  };
  requester?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  request?: {
    _id: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
  };
  message?: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'lobby_invite' | 'friend_request' | 'system';
  read: boolean;
  data: NotificationData;
  createdAt: string;
}

export function useNotifications() {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Buscar notificações do servidor
  const fetchNotifications = async () => {
    if (!isAuthenticated || !token) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        setNotifications(response.data.notifications || []);
        
        // Contar notificações não lidas
        const unread = response.data.notifications.filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId: string) => {
    if (!isAuthenticated || !token) return;

    try {
      await axios.post('/api/notifications/mark-read', 
        { notificationId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
      
      // Atualizar contador
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Aceitar convite para lobby
  const acceptLobbyInvite = async (inviteId: string) => {
    if (!isAuthenticated || !token) return;

    try {
      const response = await axios.post('/api/lobby/invite/accept', 
        { inviteId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'success') {
        // Remover a notificação ou marcá-la como lida
        setNotifications(prev => 
          prev.filter(n => 
            !(n.type === 'lobby_invite' && n.data.invite?._id === inviteId)
          )
        );
        
        // Atualizar contador
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Redirecionar para o lobby
        window.location.href = `/lobby/${response.data.lobbyId}`;
        
        return {
          success: true,
          lobbyId: response.data.lobbyId
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Erro ao aceitar convite de lobby:', error);
      return { success: false };
    }
  };

  // Recusar convite para lobby
  const rejectLobbyInvite = async (inviteId: string) => {
    if (!isAuthenticated || !token) return;

    try {
      const response = await axios.post('/api/lobby/invite/reject', 
        { inviteId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'success') {
        // Remover a notificação
        setNotifications(prev => 
          prev.filter(n => 
            !(n.type === 'lobby_invite' && n.data.invite?._id === inviteId)
          )
        );
        
        // Atualizar contador
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Erro ao recusar convite de lobby:', error);
      return { success: false };
    }
  };

  // Buscar notificações quando autenticar
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      
      // Configurar um intervalo para verificar novas notificações a cada 30 segundos
      const interval = setInterval(fetchNotifications, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    acceptLobbyInvite,
    rejectLobbyInvite
  };
} 