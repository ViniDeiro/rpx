'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  User, 
  Award, 
  Calendar, 
  Clock, 
  Zap, 
  Shield, 
  Activity, 
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  Award as TrophyIcon
} from 'react-feather';

export default function FriendProfile({ params }: { params: { username: string } }) {
  const router = useRouter();
  const { username } = params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [friendStatus, setFriendStatus] = useState<string>('none'); // none, friend, sent, received
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Obter o token de autenticação
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          router.push('/auth/login');
          return;
        }

        console.log(`Buscando perfil para: ${username}`);
        
        // Três abordagens distintas para buscar o perfil, tentando resolver o problema
        
        // ABORDAGEM 1: Buscar o perfil do usuário, obtendo os dados do próprio usuário autenticado
        // e então verificar se o username na URL corresponde ao usuário logado
        try {
          console.log("Tentando Abordagem 1: Buscar perfil próprio");
          const selfProfileResponse = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (selfProfileResponse.ok) {
            const selfData = await selfProfileResponse.json();
            
            // Se for o perfil do próprio usuário, usamos esses dados
            if (selfData.user.username === username) {
              console.log("Perfil próprio encontrado e corresponde ao username da URL");
              setProfile(selfData.user);
              setFriendStatus('self'); // Indicando que é o perfil do próprio usuário
              setIsLoading(false);
              return;
            } else {
              console.log("Username não corresponde ao usuário autenticado. Nome da URL:", username, "Nome do usuário:", selfData.user.username);
            }
          } else {
            console.log("Falha ao buscar perfil próprio:", selfProfileResponse.status, selfProfileResponse.statusText);
          }
        } catch (error) {
          console.error("Erro na Abordagem 1:", error);
        }
        
        // ABORDAGEM 2: Usar a API específica para buscar perfil por username
        try {
          console.log("Tentando Abordagem 2: API específica de perfil por username");
          const friendProfileResponse = await fetch(`/api/users/profile/${username}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (friendProfileResponse.ok) {
            const friendData = await friendProfileResponse.json();
            console.log("Perfil de amigo encontrado usando API específica");
            setProfile(friendData.user);
            
            // Verificar status de amizade
            await checkFriendshipStatus(token, friendData.user.id);
            setIsLoading(false);
            return;
          } else {
            console.log("Falha ao buscar perfil de amigo:", friendProfileResponse.status, friendProfileResponse.statusText);
          }
        } catch (error) {
          console.error("Erro na Abordagem 2:", error);
        }
        
        // ABORDAGEM 3: Buscar amigos e procurar pelo username
        try {
          console.log("Tentando Abordagem 3: Listar amigos e encontrar o username");
          const friendsResponse = await fetch('/api/users/friends', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (friendsResponse.ok) {
            const friendsData = await friendsResponse.json();
            const friend = friendsData.friends.find((friend: any) => friend.username === username);
            
            if (friend) {
              console.log("Amigo encontrado na lista de amigos");
              setProfile({
                id: friend.id,
                username: friend.username,
                avatarUrl: friend.avatarUrl,
                profile: {
                  level: friend.level || 1,
                  bio: friend.bio || '',
                  xp: friend.xp || 0
                },
                stats: friend.stats || {
                  matches: 0,
                  wins: 0
                },
                createdAt: friend.since || new Date().toISOString(),
                achievements: [],
                recentMatches: []
              });
              setFriendStatus('friend');
              setIsLoading(false);
              return;
            } else {
              console.log("Usuário não encontrado na lista de amigos");
            }
          } else {
            console.log("Falha ao buscar lista de amigos:", friendsResponse.status, friendsResponse.statusText);
          }
        } catch (error) {
          console.error("Erro na Abordagem 3:", error);
        }
        
        // Se chegou aqui, nenhuma abordagem funcionou, criamos um perfil temporário
        if (window.confirm('Não foi possível encontrar os dados deste usuário. Deseja visualizar um perfil temporário?')) {
          console.log("Criando perfil temporário");
          setProfile({
            id: 'temp-' + Math.random().toString(36).substring(2, 9),
            username: username,
            avatarUrl: '/images/avatars/default.svg',
            profile: {
              level: 1,
              bio: 'Perfil temporário',
              xp: 0
            },
            stats: {
              matches: 0,
              wins: 0
            },
            createdAt: new Date().toISOString(),
            achievements: [],
            recentMatches: [],
            isOfflineMode: true
          });
          setFriendStatus('none');
          setIsLoading(false);
        } else {
          setError('Não foi possível carregar o perfil deste usuário');
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error('Erro global ao carregar perfil:', error);
        setError('Erro ao carregar perfil');
        setIsLoading(false);
      }
    };
    
    // Função auxiliar para verificar status de amizade
    const checkFriendshipStatus = async (token: string, userId: string) => {
      try {
        const friendsResponse = await fetch('/api/users/friends', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          
          // Verificar se é amigo
          const isFriend = friendsData.friends.some((friend: any) => friend.id === userId);
          if (isFriend) {
            setFriendStatus('friend');
            return;
          }
          
          // Verificar se enviou solicitação
          const hasSent = friendsData.sent.some((request: any) => request.id === userId);
          if (hasSent) {
            setFriendStatus('sent');
            return;
          }
          
          // Verificar se recebeu solicitação
          const hasReceived = friendsData.requests.some((request: any) => request.id === userId);
          if (hasReceived) {
            setFriendStatus('received');
            return;
          }
          
          setFriendStatus('none');
        }
      } catch (error) {
        console.error('Erro ao verificar status de amizade:', error);
        setFriendStatus('none');
      }
    };
    
    fetchProfile();
  }, [username, router]);
  
  const handleFriendAction = async (action: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      if (action === 'add') {
        // Enviar solicitação de amizade
        const response = await fetch('/api/users/friends', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ userId: profile.id })
        });
        
        if (response.ok) {
          setFriendStatus('sent');
        }
      } else if (action === 'accept') {
        // Aceitar solicitação de amizade
        const response = await fetch(`/api/users/friends/${profile.id}/accept`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setFriendStatus('friend');
        }
      } else if (action === 'cancel' || action === 'reject') {
        // Cancelar solicitação enviada ou rejeitar solicitação recebida
        const response = await fetch(`/api/users/friends/${profile.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setFriendStatus('none');
        }
      } else if (action === 'remove') {
        // Remover amizade
        const response = await fetch(`/api/users/friends/${profile.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setFriendStatus('none');
        }
      }
    } catch (error) {
      console.error('Erro ao executar ação de amizade:', error);
    }
  };
  
  const renderFriendButton = () => {
    switch (friendStatus) {
      case 'friend':
        return (
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
            onClick={() => handleFriendAction('remove')}
          >
            <UserCheck size={18} />
            <span>Amigos</span>
          </button>
        );
      case 'sent':
        return (
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-md transition-colors"
            onClick={() => handleFriendAction('cancel')}
          >
            <Clock size={18} />
            <span>Solicitação enviada</span>
          </button>
        );
      case 'received':
        return (
          <div className="flex gap-2">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors"
              onClick={() => handleFriendAction('accept')}
            >
              <UserCheck size={18} />
              <span>Aceitar</span>
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 hover:bg-red-200 rounded-md transition-colors"
              onClick={() => handleFriendAction('reject')}
            >
              <UserX size={18} />
              <span>Recusar</span>
            </button>
          </div>
        );
      default:
        return (
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-md transition-colors"
            onClick={() => handleFriendAction('add')}
          >
            <UserPlus size={18} />
            <span>Adicionar amigo</span>
          </button>
        );
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Carregando perfil...</h2>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Erro ao carregar perfil</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Não foi possível carregar o perfil</p>
          <Link 
            href="/lobby" 
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors inline-block"
          >
            Voltar para o Lobby
          </Link>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return null;
  }
  
  return (
    <div className="bg-[#0D0A2A] min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho do perfil */}
        <div className="bg-[#171335] rounded-lg shadow-md overflow-hidden mb-6 border border-[#3D2A85]/20">
          {/* Banner do perfil */}
          <div className="bg-gradient-to-r from-[#3D2A85] to-[#5D3FD4] h-32 md:h-48 relative">
            {/* Botão de voltar */}
            <button 
              onClick={() => router.back()} 
              className="absolute top-4 left-4 bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-full hover:bg-opacity-30 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Indicador de modo offline */}
            {profile.isOfflineMode && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Modo Offline
              </div>
            )}
          </div>
          
          {/* Informações do usuário */}
          <div className="p-4 md:p-6 relative">
            {/* Avatar */}
            <div className="absolute -top-20 left-6 md:left-10">
              <div className="rounded-full p-1 bg-gradient-to-r from-[#8860FF] to-[#5D3FD4] inline-block shadow-lg">
                <div className="bg-[#171335] p-1 rounded-full">
                  <Image
                    src={profile.avatarUrl || '/images/avatars/default.svg'}
                    alt={profile.username}
                    width={100}
                    height={100}
                    className="rounded-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Nome e detalhes */}
            <div className="pl-32 md:pl-36 pt-2 flex flex-col md:flex-row justify-between items-start">
              <div className="text-left">
                <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
                <p className="text-[#A89ECC]">{profile.profile?.bio || "Sem biografia"}</p>
                <div className="flex items-center mt-2 text-[#A89ECC]">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              
              {/* Botão de ação de amizade */}
              <div className="mt-4 md:mt-0 flex space-x-3">
                {renderFriendButton()}
                
                <button className="flex items-center gap-2 px-4 py-2 bg-[#232048] text-white hover:bg-[#2D2A5A] rounded-md transition-colors">
                  <MessageSquare size={18} />
                  <span>Mensagem</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Estatísticas do jogador */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Estatísticas de jogo */}
          <div className="bg-[#171335] rounded-lg shadow-md p-6 border border-[#3D2A85]/20">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Activity className="mr-2 text-[#8860FF]" size={20} />
              Estatísticas de Jogo
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#232048] p-4 rounded-lg">
                <div className="text-sm text-[#A89ECC]">Partidas</div>
                <div className="text-2xl font-bold text-white">{profile.stats?.matches || 0}</div>
              </div>
              
              <div className="bg-[#232048] p-4 rounded-lg">
                <div className="text-sm text-[#A89ECC]">Vitórias</div>
                <div className="text-2xl font-bold text-green-400">{profile.stats?.wins || 0}</div>
              </div>
              
              <div className="bg-[#232048] p-4 rounded-lg">
                <div className="text-sm text-[#A89ECC]">Derrotas</div>
                <div className="text-2xl font-bold text-red-400">
                  {(profile.stats?.matches || 0) - (profile.stats?.wins || 0)}
                </div>
              </div>
              
              <div className="bg-[#232048] p-4 rounded-lg">
                <div className="text-sm text-[#A89ECC]">Taxa de Vitória</div>
                <div className="text-2xl font-bold text-[#8860FF]">
                  {profile.stats?.matches ? 
                    Math.round((profile.stats.wins / profile.stats.matches) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
          
          {/* Nível e Experiência */}
          <div className="bg-[#171335] rounded-lg shadow-md p-6 border border-[#3D2A85]/20">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Zap className="mr-2 text-yellow-400" size={20} />
              Nível e Experiência
            </h2>
            
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-white">Nível {profile.profile?.level || 1}</span>
                <span className="text-[#A89ECC]">{profile.profile?.xp || 0} / {(profile.profile?.level || 1) * 100} XP</span>
              </div>
              <div className="w-full bg-[#232048] rounded-full h-2.5">
                <div 
                  className="bg-[#8860FF] h-2.5 rounded-full" 
                  style={{ width: `${Math.min(((profile.profile?.xp || 0) / ((profile.profile?.level || 1) * 100)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-[#232048] p-4 rounded-lg text-center">
                <div className="text-4xl font-bold text-yellow-400">{profile.profile?.level || 1}</div>
                <div className="text-sm text-[#A89ECC] mt-1">Nível Atual</div>
              </div>
              
              <div className="bg-[#232048] p-4 rounded-lg text-center">
                <div className="text-4xl font-bold text-[#8860FF]">{(profile.profile?.level || 1) * 100 - (profile.profile?.xp || 0)}</div>
                <div className="text-sm text-[#A89ECC] mt-1">XP para o próximo nível</div>
              </div>
            </div>
          </div>
          
          {/* Conquistas */}
          <div className="bg-[#171335] rounded-lg shadow-md p-6 border border-[#3D2A85]/20">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <TrophyIcon className="mr-2 text-amber-400" size={20} />
              Conquistas
            </h2>
            
            {(profile.achievements?.length > 0) ? (
              <div className="grid grid-cols-2 gap-3">
                {profile.achievements.map((achievement: any, index: number) => (
                  <div key={index} className="bg-[#232048] p-3 rounded-lg flex items-center">
                    <div className="bg-amber-900/30 p-2 rounded-full mr-3">
                      <Award className="text-amber-400" size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{achievement.name}</div>
                      <div className="text-xs text-[#A89ECC]">{achievement.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#A89ECC]">
                <TrophyIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Nenhuma conquista ainda</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Partidas recentes */}
        <div className="bg-[#171335] rounded-lg shadow-md p-6 mb-6 border border-[#3D2A85]/20">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Clock className="mr-2 text-[#8860FF]" size={20} />
            Partidas Recentes
          </h2>
          
          {(profile.recentMatches?.length > 0) ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[#A89ECC] border-b border-[#3D2A85]/20">
                    <th className="pb-3 pr-4">Resultado</th>
                    <th className="pb-3 pr-4">Tipo</th>
                    <th className="pb-3 pr-4">Duração</th>
                    <th className="pb-3 pr-4">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.recentMatches.map((match: any, index: number) => (
                    <tr key={index} className="border-b border-[#3D2A85]/20 last:border-0">
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${match.won ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                          {match.won ? 'Vitória' : 'Derrota'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-white">{match.type}</td>
                      <td className="py-3 pr-4 text-white">{match.duration}</td>
                      <td className="py-3 pr-4 text-white">{new Date(match.date).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[#A89ECC]">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>Nenhuma partida recente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 