import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Notification } from '@/types/notification';
import LobbyInviteNotification from './LobbyInviteNotification';

const NotificationHandler: React.FC = () => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!session || !session.user.id) return;
    
    try {
      setLoading(true);
      console.log('Buscando notificações para o usuário:', session.user.id);
      
      // Obter o token do localStorage para autenticação
      const token = localStorage.getItem('auth_token');
      
      const response = await axios.get('/api/notifications', {
        timeout: 10000, // Aumentando o timeout para 10 segundos
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
      
      console.log('Resposta da API de notificações:', response.data);
      
      if (response.data.status === 'success') {
        const notifs = response.data.notifications || [];
        console.log(`Recebidas ${notifs.length} notificações`);
        
        // Log para verificar convites de lobby
        const lobbyInvites = notifs.filter((n: any) => n.type === 'lobby_invite');
        console.log(`Convites de lobby encontrados: ${lobbyInvites.length}`);
        if (lobbyInvites.length > 0) {
          console.log('Exemplo de convite:', JSON.stringify(lobbyInvites[0], null, 2));
        }
        
        setNotifications(notifs);
      } else {
        console.error('Erro na resposta da API:', response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      toast.error('Não foi possível carregar as notificações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      
      // Configurar polling para verificar novas notificações a cada 30 segundos
      const intervalId = setInterval(fetchNotifications, 30000);
      
      return () => clearInterval(intervalId);
    } else {
      // Se não houver sessão, não mostrar loading
      setLoading(false);
    }
  }, [session]);

  // Adicionar timeout para não ficar carregando infinitamente
  useEffect(() => {
    // Se ficar carregando por mais de 10 segundos, força parar o loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.warn('Loading timeout - forçado a parar após 10 segundos');
      }
    }, 10000);
    
    return () => clearTimeout(timeoutId);
  }, [loading]);

  const handleCloseNotification = async (notificationId: string) => {
    try {
      await axios.post('/api/notifications/mark-read', {
        notificationId
      });
      
      // Atualizar a lista de notificações localmente
      setNotifications(prev => 
        prev.filter(n => n._id.toString() !== notificationId.toString())
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotification = (notification: Notification) => {
    console.log('Renderizando notificação:', notification.type, notification._id);
    
    // Verificar se a notificação está completa antes de renderizar
    if (!notification._id) {
      console.error('Notificação com ID ausente:', notification);
      return null;
    }
    
    switch (notification.type) {
      case 'lobby_invite':
        // Verificar se os dados necessários existem
        if (!notification.data || !notification.data.inviter || !notification.data.invite) {
          console.error('Dados incompletos em um convite de lobby:', notification);
          return (
            <div key={notification._id.toString()} className="bg-slate-800 rounded-lg p-4 shadow-lg mb-2">
              <p className="text-white">Convite de lobby (dados incompletos)</p>
              <button 
                onClick={() => handleCloseNotification(notification._id.toString())} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded mt-2"
              >
                Fechar
              </button>
            </div>
          );
        }
        
        return (
          <LobbyInviteNotification
            key={notification._id.toString()}
            notification={notification}
            onClose={() => handleCloseNotification(notification._id.toString())}
            refetch={fetchNotifications}
          />
        );
      case 'friend_request':
        // Implementar componente para solicitações de amizade
        return (
          <div key={notification._id.toString()} className="bg-slate-800 rounded-lg p-4 shadow-lg mb-2">
            <p className="text-white">Nova solicitação de amizade</p>
            <button 
              onClick={() => handleCloseNotification(notification._id.toString())} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded mt-2"
            >
              Visualizar
            </button>
          </div>
        );
      default:
        return (
          <div key={notification._id.toString()} className="bg-slate-800 rounded-lg p-4 shadow-lg mb-2">
            <p className="text-white">{notification.data?.message || 'Nova notificação'}</p>
            <button 
              onClick={() => handleCloseNotification(notification._id.toString())} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded mt-2"
            >
              Fechar
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Ícone de notificação com contador */}
      <button 
        onClick={toggleNotifications}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg relative"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Painel de notificações */}
      {showNotifications && (
        <div className="absolute bottom-16 right-0 w-80 max-h-96 overflow-y-auto bg-slate-900 rounded-lg shadow-xl p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-lg font-semibold">Notificações</h3>
            <button 
              onClick={toggleNotifications} 
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map(renderNotification)
          ) : (
            <p className="text-gray-400 text-center py-4">Nenhuma notificação</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationHandler; 