import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertCircle, Info, Clock } from 'react-feather';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import axios from 'axios';

/**
 * Componente de Centro de Notificações
 * Exibe notificações do usuário e permite gerenciar notificações
 */
const NotificationCenter = () => {
  const { isAuthenticated, token } = useAuth();
  const socket = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const notificationRef = useRef(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fechar menu quando clica fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Buscar notificações iniciais e configurar socket
  useEffect(() => {
    if (isAuthenticated && socket) {
      fetchNotifications();

      // Ouvir eventos de notificação
      socket.on('notification', (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });

      // Ouvir contagem de não lidas
      socket.on('unreadNotificationsCount', (data) => {
        setUnreadCount(data.count);
      });

      // Solicitar contagem inicial
      socket.emit('getRecentNotifications', 10);

      return () => {
        socket.off('notification');
        socket.off('unreadNotificationsCount');
      };
    }
  }, [isAuthenticated, socket]);

  // Buscar notificações da API
  const fetchNotifications = async (loadMore = false) => {
    if (!isAuthenticated) return;
    
    try {
      const newPage = loadMore ? page + 1 : 0;
      
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const response = await axios.get(`/api/notifications?limit=10&offset=${newPage * 10}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const { data } = response.data;
      
      if (loadMore) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      
      setUnreadCount(data.pagination.unreadCount);
      setPage(newPage);
      setHasMore(data.notifications.length === 10);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Marcar como lida
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Atualizar contagem
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Notificar o socket
      if (socket) {
        socket.emit('markNotificationRead', notificationId);
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Zerar contagem
      setUnreadCount(0);
      
      // Notificar o socket
      if (socket) {
        socket.emit('markAllNotificationsRead');
      }
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
    }
  };

  // Obter ícone com base no tipo de notificação
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'welcome':
      case 'system_announcement':
        return <Info className="text-blue-500" size={18} />;
      case 'match_invitation':
      case 'match_reminder':
        return <Clock className="text-purple-500" size={18} />;
      case 'transaction_completed':
      case 'deposit_received':
      case 'withdrawal_processed':
        return <Check className="text-green-500" size={18} />;
      case 'match_dispute':
        return <AlertCircle className="text-red-500" size={18} />;
      default:
        return <Info className="text-gray-500" size={18} />;
    }
  };

  // Formatar tempo relativo
  const formatTime = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true,
        locale: ptBR
      });
    } catch (e) {
      return 'data desconhecida';
    }
  };

  // Renderizar notificação individual
  const renderNotification = (notification) => {
    return (
      <div 
        key={notification._id}
        className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer flex ${notification.read ? 'opacity-70' : 'bg-blue-50'}`}
        onClick={() => !notification.read && markAsRead(notification._id)}
      >
        <div className="mr-3 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1">
          <div className="font-medium">{notification.title}</div>
          <div className="text-sm text-gray-600">{notification.message}</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatTime(notification.createdAt)}
          </div>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={notificationRef}>
      <button 
        className="p-2 rounded-full hover:bg-gray-100 relative focus:outline-none" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir centro de notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-medium">Notificações</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button 
                  className="text-xs text-blue-500 hover:underline"
                  onClick={markAllAsRead}
                >
                  Marcar todas como lidas
                </button>
              )}
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Carregando...</div>
            ) : notifications.length > 0 ? (
              <>
                {notifications.map(renderNotification)}
                {hasMore && (
                  <div className="p-3 text-center">
                    <button 
                      className="text-sm text-blue-500 hover:underline"
                      onClick={() => fetchNotifications(true)}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Carregando...' : 'Carregar mais'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Nenhuma notificação encontrada.
              </div>
            )}
          </div>
          
          <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
            <a 
              href="/notifications" 
              className="text-xs text-blue-500 hover:underline"
            >
              Ver todas as notificações
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter; 