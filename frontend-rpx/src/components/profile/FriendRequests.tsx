import { useState, useEffect } from 'react';
import { UserPlus, Check, X, User, UserMinus, Award } from 'react-feather';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface FriendItem {
  id: string;
  username: string;
  avatarUrl: string;
  level: number;
  stats?: {
    matches: number;
    winRate: number;
  };
}

interface FriendRequestsProps {
  onStatusChange?: () => void;
}

export default function FriendRequests({ onStatusChange }: FriendRequestsProps) {
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<FriendItem[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [requestStatus, setRequestStatus] = useState<{[key: string]: string}>({});
  
  // Buscar amigos e solicitações
  const fetchFriendData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/friends', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados de amizade');
      }
      
      const data = await response.json();
      setRequests(data.requests || []);
      setFriends(data.friends || []);
      
    } catch (error: any) {
      console.error('Erro ao carregar dados de amizade:', error);
      setError(error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar dados ao montar componente
  useEffect(() => {
    fetchFriendData();
  }, [token]);
  
  // Aceitar solicitação
  const acceptRequest = async (userId: string) => {
    if (!token) return;
    
    try {
      setRequestStatus({ ...requestStatus, [userId]: 'loading' });
      
      const response = await fetch('/api/users/friends', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao aceitar solicitação');
      }
      
      // Atualizar UI
      setRequestStatus({ ...requestStatus, [userId]: 'accepted' });
      
      // Recarregar dados após um breve delay
      setTimeout(() => {
        fetchFriendData();
        if (onStatusChange) onStatusChange();
      }, 1000);
      
    } catch (error: any) {
      console.error('Erro ao aceitar solicitação:', error);
      setRequestStatus({ ...requestStatus, [userId]: 'error' });
    }
  };
  
  // Rejeitar solicitação
  const rejectRequest = async (userId: string) => {
    if (!token) return;
    
    try {
      setRequestStatus({ ...requestStatus, [userId]: 'loading' });
      
      const response = await fetch(`/api/users/friends?userId=${userId}&action=reject`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao rejeitar solicitação');
      }
      
      // Atualizar UI
      setRequestStatus({ ...requestStatus, [userId]: 'rejected' });
      
      // Recarregar dados após um breve delay
      setTimeout(() => {
        fetchFriendData();
        if (onStatusChange) onStatusChange();
      }, 1000);
      
    } catch (error: any) {
      console.error('Erro ao rejeitar solicitação:', error);
      setRequestStatus({ ...requestStatus, [userId]: 'error' });
    }
  };
  
  // Remover amizade
  const removeFriend = async (userId: string) => {
    if (!token) return;
    
    try {
      setRequestStatus({ ...requestStatus, [userId]: 'loading' });
      
      const response = await fetch(`/api/users/friends?userId=${userId}&action=remove`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover amizade');
      }
      
      // Atualizar UI
      setRequestStatus({ ...requestStatus, [userId]: 'removed' });
      
      // Recarregar dados após um breve delay
      setTimeout(() => {
        fetchFriendData();
        if (onStatusChange) onStatusChange();
      }, 1000);
      
    } catch (error: any) {
      console.error('Erro ao remover amizade:', error);
      setRequestStatus({ ...requestStatus, [userId]: 'error' });
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Solicitações pendentes */}
      {requests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-white">Solicitações pendentes</h3>
          <div className="space-y-2">
            {requests.map((request) => (
              <div 
                key={request.id} 
                className={`bg-card-hover border border-border rounded-lg p-3 flex items-center justify-between transition-all ${
                  requestStatus[request.id] === 'rejected' ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-primary/30 p-0.5 overflow-hidden">
                    <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                      <Image 
                        src={request.avatarUrl} 
                        alt={request.username}
                        width={40} 
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  <div className="ml-3">
                    <div className="font-medium text-white">{request.username}</div>
                    <div className="text-xs text-white/50">Nível {request.level}</div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {requestStatus[request.id] === 'loading' ? (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : requestStatus[request.id] === 'accepted' ? (
                    <span className="px-3 py-1.5 rounded bg-green-600/20 text-green-400 text-sm">
                      Aceito
                    </span>
                  ) : requestStatus[request.id] === 'rejected' ? (
                    <span className="px-3 py-1.5 rounded bg-red-600/20 text-red-400 text-sm">
                      Rejeitado
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => acceptRequest(request.id)}
                        className="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors"
                        title="Aceitar"
                      >
                        <Check size={16} />
                      </button>
                      
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
                        title="Rejeitar"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Lista de amigos */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
          <User size={18} className="mr-2" />
          Amigos ({friends.length})
        </h3>
        
        {friends.length === 0 ? (
          <div className="bg-card-hover border border-border rounded-lg p-4 text-center text-white/70">
            Você ainda não tem amigos. Busque jogadores para adicionar!
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {friends.map((friend) => (
              <div 
                key={friend.id} 
                className={`bg-card-hover border border-border rounded-lg p-3 flex items-center justify-between transition-all ${
                  requestStatus[friend.id] === 'removed' ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-primary/30 p-0.5 overflow-hidden">
                    <img 
                      src={friend.avatarUrl || '/images/avatars/default.svg'} 
                      alt={friend.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-white font-medium flex items-center">
                      {friend.username}
                      <span className="ml-2 text-xs bg-primary/30 text-primary-light px-1.5 py-0.5 rounded">
                        Nv. {friend.level || 1}
                      </span>
                    </div>
                    <div className="text-xs text-white/60">
                      <span className="flex items-center">
                        {friend.stats?.matches ? (
                          <>
                            <Award className="w-3 h-3 mr-1 text-yellow-500" />
                            <span>Taxa de vitória: {friend.stats.winRate}%</span>
                          </>
                        ) : (
                          'Nenhuma partida jogada'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/profile/${friend.username}`}
                    className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                    title="Ver perfil"
                  >
                    <User size={16} />
                  </Link>
                  
                  {requestStatus[friend.id] === 'loading' ? (
                    <div className="w-8 h-8 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : requestStatus[friend.id] === 'removed' ? (
                    <span className="px-3 py-1.5 rounded bg-red-600/20 text-red-400 text-sm">
                      Removido
                    </span>
                  ) : (
                    <button
                      onClick={() => removeFriend(friend.id)}
                      className="p-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                      title="Remover amizade"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 