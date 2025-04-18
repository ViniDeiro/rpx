import React, { useState, useCallback } from 'react';
import { X, Bell, Users } from 'react-feather';
import { toast } from 'react-toastify';
import FriendRequestNotification from './FriendRequestNotification';
import LobbyInviteNotification from './LobbyInviteNotification';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: any[];
  onUpdate: () => void;
}

interface NotificationsState {
  friendRequests: any[];
  lobbyInvites: any[];
  loading: boolean;
  unreadCount: number;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose,
  notifications = [],
  onUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'todos' | 'amigos' | 'lobby'>('todos');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Preparar dados para exibição
  const friendRequests = notifications.filter(n => n.type === 'friend_request');
  const lobbyInvites = notifications.filter(n => n.type === 'lobby_invite');
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Efeito para recarregar notificações quando abrir o painel
  React.useEffect(() => {
    if (isOpen) {
      onUpdate();
    }
  }, [isOpen, onUpdate]);
  
  const acceptFriendRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/friends/requests?requestId=${requestId}`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Solicitação de amizade aceita');
        onUpdate(); // Atualizar todas as notificações
      } else {
        toast.error(data.error || 'Erro ao aceitar solicitação');
      }
    } catch (error) {
      console.error('Erro ao aceitar solicitação de amizade:', error);
      toast.error('Erro ao aceitar solicitação');
    } finally {
      setLoading(false);
    }
  };
  
  const rejectFriendRequest = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/friends/requests?requestId=${requestId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Solicitação de amizade rejeitada');
        onUpdate(); // Atualizar todas as notificações
      } else {
        toast.error(data.error || 'Erro ao rejeitar solicitação');
      }
    } catch (error) {
      console.error('Erro ao rejeitar solicitação de amizade:', error);
      toast.error('Erro ao rejeitar solicitação');
    } finally {
      setLoading(false);
    }
  };
  
  const acceptLobbyInvite = async (inviteId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/lobby/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Convite aceito com sucesso');
        onUpdate(); // Atualizar todas as notificações
        onClose(); // Fechar o painel para que o usuário possa ver o lobby
      } else {
        toast.error(data.error || 'Erro ao aceitar convite');
      }
    } catch (error) {
      console.error('Erro ao aceitar convite para lobby:', error);
      toast.error('Erro ao aceitar convite');
    } finally {
      setLoading(false);
    }
  };
  
  const rejectLobbyInvite = async (inviteId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/lobby/invite?inviteId=${inviteId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Convite rejeitado');
        onUpdate(); // Atualizar todas as notificações
      } else {
        toast.error(data.error || 'Erro ao rejeitar convite');
      }
    } catch (error) {
      console.error('Erro ao rejeitar convite para lobby:', error);
      toast.error('Erro ao rejeitar convite');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-black bg-opacity-50 absolute inset-0" onClick={onClose}></div>
      <div className="bg-gray-900 w-full max-w-md h-full overflow-y-auto z-10 transition-transform duration-300 ease-in-out transform"
           style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Notificações</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-gray-800">
          <button
            className={`flex-1 py-3 font-medium ${activeTab === 'todos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('todos')}
          >
            Todos ({unreadCount})
          </button>
          <button
            className={`flex-1 py-3 font-medium ${activeTab === 'amigos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('amigos')}
          >
            Amigos ({friendRequests.length})
          </button>
          <button
            className={`flex-1 py-3 font-medium ${activeTab === 'lobby' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('lobby')}
          >
            Lobby ({lobbyInvites.length})
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'todos' && (
                <>
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Bell size={32} className="mx-auto mb-2" />
                      <p>Nenhuma notificação disponível</p>
                    </div>
                  ) : (
                    <>
                      {lobbyInvites.map(invite => (
                        <LobbyInviteNotification 
                          key={invite._id} 
                          invite={invite} 
                          onAccept={acceptLobbyInvite} 
                          onReject={rejectLobbyInvite} 
                          onDismiss={async () => { onUpdate(); return Promise.resolve(); }}
                        />
                      ))}
                      {friendRequests.map(request => (
                        <FriendRequestNotification 
                          key={request._id} 
                          request={request} 
                          onAccept={acceptFriendRequest} 
                          onReject={rejectFriendRequest} 
                        />
                      ))}
                    </>
                  )}
                </>
              )}

              {activeTab === 'amigos' && (
                <>
                  {friendRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users size={32} className="mx-auto mb-2" />
                      <p>Nenhuma solicitação de amizade</p>
                    </div>
                  ) : (
                    friendRequests.map(request => (
                      <FriendRequestNotification 
                        key={request._id} 
                        request={request} 
                        onAccept={acceptFriendRequest} 
                        onReject={rejectFriendRequest} 
                      />
                    ))
                  )}
                </>
              )}

              {activeTab === 'lobby' && (
                <>
                  {lobbyInvites.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users size={32} className="mx-auto mb-2" />
                      <p>Nenhum convite para lobby</p>
                    </div>
                  ) : (
                    lobbyInvites.map(invite => (
                      <LobbyInviteNotification 
                        key={invite._id} 
                        invite={invite} 
                        onAccept={acceptLobbyInvite} 
                        onReject={rejectLobbyInvite}
                        onDismiss={async () => { onUpdate(); return Promise.resolve(); }}
                      />
                    ))
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter; 