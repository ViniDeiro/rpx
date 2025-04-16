import React, { useState, useCallback } from 'react';
import { X, Bell, Users } from 'react-feather';
import { toast } from 'react-toastify';
import FriendRequestNotification from './FriendRequestNotification';
import LobbyInviteNotification from './LobbyInviteNotification';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationsState {
  friendRequests: any[];
  lobbyInvites: any[];
  loading: boolean;
  unreadCount: number;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'todos' | 'amigos' | 'lobby'>('todos');
  const [notifications, setNotifications] = useState<NotificationsState>({
    friendRequests: [],
    lobbyInvites: [],
    loading: true,
    unreadCount: 0
  });
  
  const fetchNotifications = useCallback(async () => {
    setNotifications(prev => ({ ...prev, loading: true }));
    try {
      const friendReqRes = await fetch('/api/friends/requests');
      const friendReqData = await friendReqRes.json();
      
      const lobbyInvitesRes = await fetch('/api/lobby/invite');
      const lobbyInvitesData = await lobbyInvitesRes.json();
      
      if (friendReqData.status === 'success' && lobbyInvitesData.status === 'success') {
        setNotifications({
          friendRequests: friendReqData.requests || [],
          lobbyInvites: lobbyInvitesData.invites || [],
          loading: false,
          unreadCount: (friendReqData.requests?.length || 0) + (lobbyInvitesData.invites?.length || 0)
        });
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setNotifications(prev => ({ ...prev, loading: false }));
      toast.error('Erro ao carregar notificações');
    }
  }, []);
  
  React.useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);
  
  const acceptFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests?requestId=${requestId}`, {
        method: 'PUT'
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setNotifications(prev => ({
          ...prev,
          friendRequests: prev.friendRequests.filter(req => req._id !== requestId),
          unreadCount: prev.unreadCount - 1
        }));
        toast.success('Solicitação de amizade aceita');
      } else {
        toast.error(data.error || 'Erro ao aceitar solicitação');
      }
    } catch (error) {
      console.error('Erro ao aceitar solicitação de amizade:', error);
      toast.error('Erro ao aceitar solicitação');
    }
  };
  
  const rejectFriendRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests?requestId=${requestId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setNotifications(prev => ({
          ...prev,
          friendRequests: prev.friendRequests.filter(req => req._id !== requestId),
          unreadCount: prev.unreadCount - 1
        }));
        toast.success('Solicitação de amizade rejeitada');
      } else {
        toast.error(data.error || 'Erro ao rejeitar solicitação');
      }
    } catch (error) {
      console.error('Erro ao rejeitar solicitação de amizade:', error);
      toast.error('Erro ao rejeitar solicitação');
    }
  };
  
  const acceptLobbyInvite = async (lobbyId: string) => {
    try {
      setNotifications(prev => ({
        ...prev,
        lobbyInvites: prev.lobbyInvites.filter(invite => invite.lobbyId !== lobbyId),
        unreadCount: prev.unreadCount - 1
      }));
      toast.success('Convite aceito com sucesso');
      onClose();
    } catch (error) {
      console.error('Erro ao aceitar convite para lobby:', error);
      toast.error('Erro ao aceitar convite');
    }
  };
  
  const rejectLobbyInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/lobby/invite?inviteId=${inviteId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setNotifications(prev => ({
          ...prev,
          lobbyInvites: prev.lobbyInvites.filter(invite => invite._id !== inviteId),
          unreadCount: prev.unreadCount - 1
        }));
        toast.success('Convite rejeitado');
      } else {
        toast.error(data.error || 'Erro ao rejeitar convite');
      }
    } catch (error) {
      console.error('Erro ao rejeitar convite para lobby:', error);
      toast.error('Erro ao rejeitar convite');
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
            Todos ({notifications.unreadCount})
          </button>
          <button
            className={`flex-1 py-3 font-medium ${activeTab === 'amigos' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('amigos')}
          >
            Amigos ({notifications.friendRequests.length})
          </button>
          <button
            className={`flex-1 py-3 font-medium ${activeTab === 'lobby' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}
            onClick={() => setActiveTab('lobby')}
          >
            Lobby ({notifications.lobbyInvites.length})
          </button>
        </div>

        <div className="p-4">
          {notifications.loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'todos' && (
                <>
                  {notifications.unreadCount === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Bell size={32} className="mx-auto mb-2" />
                      <p>Nenhuma notificação disponível</p>
                    </div>
                  ) : (
                    <>
                      {notifications.lobbyInvites.map(invite => (
                        <LobbyInviteNotification 
                          key={invite._id} 
                          invite={invite} 
                          onAccept={acceptLobbyInvite} 
                          onReject={rejectLobbyInvite} 
                        />
                      ))}
                      {notifications.friendRequests.map(request => (
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
                  {notifications.friendRequests.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users size={32} className="mx-auto mb-2" />
                      <p>Nenhuma solicitação de amizade</p>
                    </div>
                  ) : (
                    notifications.friendRequests.map(request => (
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
                  {notifications.lobbyInvites.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users size={32} className="mx-auto mb-2" />
                      <p>Nenhum convite para lobby</p>
                    </div>
                  ) : (
                    notifications.lobbyInvites.map(invite => (
                      <LobbyInviteNotification 
                        key={invite._id} 
                        invite={invite} 
                        onAccept={acceptLobbyInvite} 
                        onReject={rejectLobbyInvite} 
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