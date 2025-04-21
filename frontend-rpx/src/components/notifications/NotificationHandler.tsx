import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Notification, DirectLobbyInviteNotification } from '@/types/notification';
import LobbyInviteNotification from './LobbyInviteNotification';

// Interface que corresponde ao que o componente LobbyInviteNotification espera
interface ComponentLobbyInvite {
  _id: string | import('mongodb').ObjectId;
  type: string;
  read: boolean;
  status: string;
  createdAt: string | Date;
  inviterId?: string;
  inviterName?: string;
  inviterAvatar?: string;
  lobbyId: string | import('mongodb').ObjectId;
  lobbyName?: string;
  gameMode?: string;
  inviter?: any;
  recipient?: string | import('mongodb').ObjectId;
  data?: any;
}

const NotificationHandler: React.FC = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      console.log('NotificationHandler: Não autenticado ou sem ID de usuário', {
        status: sessionStatus,
        userId: session?.user?.id
      });
      setAuthError('Usuário não autenticado');
      return;
    }
    
    try {
      setLoading(true);
      console.log('NotificationHandler: Buscando notificações para o usuário:', session.user.id);
      
      // Obter o token do localStorage para autenticação
      const token = localStorage.getItem('auth_token');
      console.log('NotificationHandler: Token disponível?', !!token);
      
      const response = await axios.get('/api/notifications', {
        timeout: 10000, // Aumentando o timeout para 10 segundos
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });
      
      console.log('NotificationHandler: Resposta da API de notificações:', response.data);
      
      if (response.data.success) {
        const notifs = response.data.data.notifications || [];
        console.log(`NotificationHandler: Recebidas ${notifs.length} notificações`);
        
        // Log para verificar convites de lobby
        const lobbyInvites = notifs.filter((n: any) => n.type === 'lobby_invite');
        console.log(`NotificationHandler: Convites de lobby encontrados: ${lobbyInvites.length}`);
        if (lobbyInvites.length > 0) {
          console.log('NotificationHandler: Exemplo de convite:', JSON.stringify(lobbyInvites[0], null, 2));
        }
        
        // Garantir que todas as notificações possuam um ID
        const validNotifications = notifs.filter((n: any) => n && (n._id || n.id));
        
        if (validNotifications.length < notifs.length) {
          console.warn(`NotificationHandler: Filtradas ${notifs.length - validNotifications.length} notificações inválidas`);
        }
        
        setNotifications(validNotifications);
        setAuthError(null);
      } else {
        console.error('NotificationHandler: Erro na resposta da API:', response.data);
        // Mostrar toast de erro para o usuário
        toast.error('Erro ao carregar notificações');
        setAuthError('Erro na resposta da API');
      }
    } catch (error) {
      console.error('NotificationHandler: Erro ao buscar notificações:', error);
      
      // Verificar o tipo de erro para mostrar uma mensagem mais específica
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Erro de resposta do servidor
          console.error('NotificationHandler: Erro de resposta:', error.response.status, error.response.data);
          
          if (error.response.status === 401) {
            setAuthError('Não autorizado. Verifique seu login.');
          } else {
            setAuthError(`Erro ${error.response.status}: ${error.response.data?.error || 'Erro desconhecido'}`);
          }
        } else if (error.request) {
          // Erro de requisição (não recebeu resposta)
          console.error('NotificationHandler: Erro de requisição:', error.request);
          setAuthError('Servidor não respondeu. Tente novamente mais tarde.');
        } else {
          // Erro na configuração da requisição
          console.error('NotificationHandler: Erro de configuração:', error.message);
          setAuthError('Erro ao configurar requisição');
        }
        
        if (error.code === 'ECONNABORTED') {
          toast.error('Tempo limite excedido ao buscar notificações');
          setAuthError('Timeout na conexão');
        }
      } else {
        toast.error('Não foi possível carregar as notificações');
        setAuthError('Erro desconhecido');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('NotificationHandler: Status da sessão mudou:', sessionStatus);
    
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      console.log('NotificationHandler: Usuário autenticado, buscando notificações');
      fetchNotifications();
      
      // Configurar polling para verificar novas notificações a cada 30 segundos
      const intervalId = setInterval(fetchNotifications, 30000);
      
      return () => clearInterval(intervalId);
    } else if (sessionStatus === 'unauthenticated') {
      console.log('NotificationHandler: Usuário não autenticado');
      setAuthError('Usuário não autenticado');
      setLoading(false);
    } else if (sessionStatus === 'loading') {
      console.log('NotificationHandler: Carregando sessão...');
      // Manter o estado de loading enquanto a sessão estiver carregando
    }
  }, [session, sessionStatus]);

  // Adicionar timeout para não ficar carregando infinitamente
  useEffect(() => {
    // Se ficar carregando por mais de 10 segundos, força parar o loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        console.warn('NotificationHandler: Loading timeout - forçado a parar após 10 segundos');
      }
    }, 10000);
    
    return () => clearTimeout(timeoutId);
  }, [loading]);

  const handleCloseNotification = async (notificationId: string) => {
    try {
      console.log('NotificationHandler: Marcando notificação como lida:', notificationId);
      
      await axios.post('/api/notifications/mark-read', {
        notificationId
      });
      
      console.log('NotificationHandler: Notificação marcada como lida com sucesso');
      
      // Atualizar a lista de notificações localmente
      setNotifications(prev => 
        prev.filter(n => n._id.toString() !== notificationId.toString())
      );
    } catch (error) {
      console.error('NotificationHandler: Erro ao marcar notificação como lida:', error);
      toast.error('Não foi possível marcar a notificação como lida');
    }
  };

  const handleAcceptInvite = async (id: string) => {
    // A lógica de aceitar foi movida para o componente LobbyInviteNotification
    // Remover a notificação após aceitar
    handleCloseNotification(id);
    // Recarregar notificações
    fetchNotifications();
  };

  const handleRejectInvite = async (id: string) => {
    // A lógica de rejeitar foi movida para o componente LobbyInviteNotification
    // Remover a notificação após rejeitar
    handleCloseNotification(id);
    // Recarregar notificações
    fetchNotifications();
  };

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
    // Recarregar notificações ao abrir
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Função para verificar se uma notificação é do tipo LobbyInvite
  const isLobbyInvite = (notification: Notification): notification is DirectLobbyInviteNotification => {
    return notification.type === 'lobby_invite' && 'lobbyId' in notification && 'status' in notification;
  };

  // Função para converter uma DirectLobbyInviteNotification para o formato esperado pelo componente
  const adaptLobbyInvite = (notification: DirectLobbyInviteNotification): ComponentLobbyInvite => {
    return {
      ...notification,
      // Quaisquer campos adicionais que precisem ser convertidos ou fornecidos explicitamente
    };
  };

  const renderNotification = (notification: Notification) => {
    console.log('NotificationHandler: Renderizando notificação:', notification.type, notification._id);
    
    // Verificar se a notificação está completa antes de renderizar
    if (!notification._id) {
      console.error('NotificationHandler: Notificação com ID ausente:', notification);
      return null;
    }
    
    switch (notification.type) {
      case 'lobby_invite':
        // Verificar se a notificação tem a estrutura esperada de um LobbyInvite
        if (isLobbyInvite(notification)) {
          // Adaptar a notificação para o formato esperado pelo componente
          const adaptedInvite = adaptLobbyInvite(notification);
          
          return (
            <LobbyInviteNotification
              key={notification._id.toString()}
              invite={adaptedInvite}
              onAccept={handleAcceptInvite}
              onReject={handleRejectInvite}
              onDismiss={() => handleCloseNotification(notification._id.toString())}
            />
          );
        } else {
          console.error('NotificationHandler: Formato de convite de lobby inválido:', notification);
          return (
            <div key={notification._id.toString()} className="bg-slate-800 rounded-lg p-4 shadow-lg mb-2">
              <p className="text-white">Convite de lobby (formato inválido)</p>
              <button 
                onClick={() => handleCloseNotification(notification._id.toString())} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded mt-2"
              >
                Fechar
              </button>
            </div>
          );
        }
      
      case 'friend_request':
        // Verificação de tipo para friend_request
        if ('data' in notification && notification.data?.requester) {
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
        }
        return null;
        
      default:
        // Verificação de tipo para mensagens do sistema
        if ('data' in notification && notification.data?.message) {
          return (
            <div key={notification._id.toString()} className="bg-slate-800 rounded-lg p-4 shadow-lg mb-2">
              <p className="text-white">{notification.data.message}</p>
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
          <div key={notification._id.toString()} className="bg-slate-800 rounded-lg p-4 shadow-lg mb-2">
            <p className="text-white">Nova notificação</p>
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

  // Se o usuário não estiver autenticado, não renderizar o componente
  if (sessionStatus === 'unauthenticated') {
    console.log('NotificationHandler: Não renderizando - usuário não autenticado');
    return null;
  }

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
          ) : authError ? (
            <div className="text-center py-4">
              <p className="text-red-400 text-sm mb-2">{authError}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded"
              >
                Recarregar
              </button>
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