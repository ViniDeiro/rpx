import { useState, useEffect } from 'react';
import { Search, User, UserPlus, Check, X, AlertCircle } from 'react-feather';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface UserSearchResult {
  id: string;
  username: string;
  avatarUrl: string;
  level: number;
  status?: 'none' | 'friend' | 'sent' | 'received';
}

interface FriendSearchProps {
  onInviteFriend?: (friend: {id: string, name: string, avatar: string, level: number}) => void;
}

export default function FriendSearch({ onInviteFriend }: FriendSearchProps) {
  const { user, token } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [friendRequests, setFriendRequests] = useState<{[key: string]: string}>({});
  
  // Buscar amigos
  const searchUsers = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return;
    }
    
    setIsSearching(true);
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
      }
      
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Erro na busca:', error);
      setError('Falha ao buscar usuários. Tente novamente.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
      setIsSearching(true);
    }
  };
  
  // Enviar solicitação de amizade
  const sendFriendRequest = async (userId: string) => {
    try {
      // Atualizar UI imediatamente para feedback ao usuário
      setFriendRequests({
        ...friendRequests,
        [userId]: 'loading'
      });
      
      const response = await fetch('/api/users/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Erro na resposta:', response.status, data);
        throw new Error(data.error || 'Erro ao enviar solicitação');
      }
      
      // Atualizar status na UI
      setFriendRequests({
        ...friendRequests,
        [userId]: 'sent'
      });
      
      // Atualizar resultados para refletir a nova solicitação
      setSearchResults(searchResults.map(user => 
        user.id === userId 
          ? { ...user, status: 'sent' } 
          : user
      ));
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      setFriendRequests({
        ...friendRequests,
        [userId]: 'error'
      });
      
      // Mostrar mensagem de erro específica
      setError(`Falha ao enviar solicitação: ${error.message || 'Erro desconhecido'}`);
    }
  };
  
  // Convidar para o lobby (usuários que já são amigos)
  const inviteFriend = (user: UserSearchResult) => {
    if (onInviteFriend) {
      onInviteFriend({
        id: user.id,
        name: user.username,
        avatar: user.avatarUrl,
        level: user.level
      });
    }
  };
  
  // Resetar a busca
  const resetSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setError(null);
  };
  
  // Lidar com mudança no campo de busca
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length === 0) {
      resetSearch();
    }
  };
  
  // Lidar com envio do formulário de busca
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchUsers();
  };
  
  return (
    <div className="w-full">
      <form onSubmit={handleSearchSubmit}>
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar jogadores..."
            className="w-full bg-card-hover rounded-lg px-4 py-2.5 pl-10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border focus:border-primary/50 transition-all"
          />
          <div className="absolute top-1/2 left-3 transform -translate-y-1/2 text-white/50">
            <Search size={16} />
          </div>
          
          {searchQuery && (
            <button
              type="button"
              onClick={resetSearch}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <button 
          type="submit"
          className="w-full py-2 rounded-lg bg-primary/80 hover:bg-primary text-white text-sm transition-colors mb-4"
        >
          Buscar
        </button>
      </form>
      
      {isLoading && (
        <div className="text-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/60 text-sm mt-2">Buscando...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-white/90">{error}</p>
        </div>
      )}
      
      {isSearching && searchResults.length === 0 && !isLoading && !error && (
        <div className="text-center py-4 text-white/60">
          Nenhum resultado encontrado para "{searchQuery}"
        </div>
      )}
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {searchResults.map((user) => (
          <div key={user.id} className="bg-card-hover border border-border hover:border-primary/30 rounded-lg p-3 flex items-center justify-between transition-all">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-primary/30 p-0.5 overflow-hidden">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                  <Image 
                    src={user.avatarUrl} 
                    alt={user.username}
                    width={40} 
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="ml-3">
                <div className="font-medium text-white">{user.username}</div>
                <div className="text-xs text-white/50">Nível {user.level}</div>
              </div>
            </div>
            
            <div>
              {user.status === 'friend' ? (
                <button
                  onClick={() => inviteFriend(user)}
                  className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-sm flex items-center transition-all"
                >
                  <User size={14} className="mr-1.5" />
                  Convidar
                </button>
              ) : user.status === 'sent' || friendRequests[user.id] === 'sent' ? (
                <span className="px-3 py-1.5 rounded bg-primary/30 text-white/70 text-sm flex items-center">
                  <Check size={14} className="mr-1.5" />
                  Enviado
                </span>
              ) : user.status === 'received' ? (
                <button
                  onClick={() => inviteFriend(user)}
                  className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white text-sm flex items-center transition-all"
                >
                  <Check size={14} className="mr-1.5" />
                  Aceitar
                </button>
              ) : friendRequests[user.id] === 'loading' ? (
                <span className="px-3 py-1.5 rounded bg-primary/30 text-white/70 text-sm flex items-center">
                  <div className="w-3 h-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin mr-1.5"></div>
                  Enviando
                </span>
              ) : friendRequests[user.id] === 'error' ? (
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm flex items-center transition-all"
                >
                  <AlertCircle size={14} className="mr-1.5" />
                  Tentar novamente
                </button>
              ) : (
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  className="px-3 py-1.5 rounded bg-primary hover:bg-primary/80 text-white text-sm flex items-center transition-all"
                >
                  <UserPlus size={14} className="mr-1.5" />
                  Adicionar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 