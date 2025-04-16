import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Users, UserPlus, Send } from 'react-feather';
import Image from 'next/image';
import Link from 'next/link';

interface Friend {
  id: string;
  username: string;
  avatarUrl: string;
  status?: 'online' | 'offline' | 'in-game';
  level?: number;
  invited?: boolean;
}

interface InviteFriendToLobbyProps {
  lobbyId: string;
  className?: string;
}

export default function InviteFriendToLobby({ lobbyId, className = '' }: InviteFriendToLobbyProps) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<{[key: string]: boolean}>({});

  const fetchFriends = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await axios.get('/api/users/friends', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Erro ao buscar amigos:', error);
      toast.error('Não foi possível carregar sua lista de amigos');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchFriends();
  };

  const handleInvite = async (friendId: string) => {
    if (!token || inviting[friendId]) return;
    
    try {
      setInviting({ ...inviting, [friendId]: true });
      
      const response = await axios.post('/api/lobby/invite', 
        { recipientId: friendId, lobbyId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success('Convite enviado com sucesso!');
      
      // Opcional: Remover o amigo da lista ou marcar como convidado
      setFriends(prev => 
        prev.map(friend => 
          friend.id === friendId ? { ...friend, invited: true } : friend
        )
      );
      
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      toast.error(error.response?.data?.error || 'Erro ao enviar convite');
    } finally {
      setInviting({ ...inviting, [friendId]: false });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleOpen}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <UserPlus size={16} />
        <span>Convidar Amigos</span>
      </button>
      
      {isOpen && (
        <>
          {/* Overlay para fechar o modal */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Modal */}
          <div className="absolute right-0 mt-2 w-72 bg-card-bg border border-border rounded-lg shadow-lg z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <Users size={18} className="mr-2 text-primary" />
                Convidar Amigos
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : friends.length === 0 ? (
              <div className="py-6 text-center text-gray-400">
                <p>Você não tem amigos para convidar</p>
                <p className="text-sm mt-2">Faça amigos para jogar junto!</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                {friends.map(friend => (
                  <div 
                    key={friend.id}
                    className="flex items-center justify-between p-2 hover:bg-card-hover rounded-lg transition-colors mb-1"
                  >
                    <div className="flex items-center">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-primary/10">
                        <Image 
                          src={friend.avatarUrl || '/images/avatars/default.png'}
                          alt={friend.username}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                        {friend.status && (
                          <div 
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-card-bg rounded-full 
                              ${friend.status === 'online' ? 'bg-green-500' : 
                                friend.status === 'in-game' ? 'bg-blue-500' : 'bg-gray-500'}`
                            }
                          ></div>
                        )}
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium">{friend.username}</div>
                        <div className="text-xs text-gray-400">
                          {friend.status === 'online' ? 'Online' : 
                           friend.status === 'in-game' ? 'Em jogo' : 'Offline'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={`/profile/${friend.username}`}
                        className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                      >
                        Perfil
                      </Link>
                      
                      <button
                        onClick={() => handleInvite(friend.id)}
                        disabled={friend.invited || inviting[friend.id]}
                        className={`px-2 py-1 rounded text-xs ${
                          friend.invited 
                            ? 'bg-green-600/30 text-white cursor-not-allowed' 
                            : inviting[friend.id]
                              ? 'bg-primary/30 text-white cursor-wait'
                              : 'bg-primary hover:bg-primary-dark text-white'
                        }`}
                      >
                        {friend.invited 
                          ? 'Convidado' 
                          : inviting[friend.id] 
                            ? 'Enviando...' 
                            : 'Convidar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 