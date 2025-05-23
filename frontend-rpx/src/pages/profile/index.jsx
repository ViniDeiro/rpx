import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { User, Shield, Award, Edit, Clock, DollarSign, Star, ArrowRight } from 'react-feather';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import CharacterViewer from '@/components/3d/CharacterViewer';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    matches: 0,
    wins: 0,
    totalEarnings: 0,
    winRate: 0,
    level: 1,
    xp: 0,
    nextLevelXp: 100,
  });
  const [matchHistory, setMatchHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/profile');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Carregar dados do usuário da API
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setIsDataLoading(true);
      
      // Função para carregar estatísticas
      const loadUserStats = async () => {
        try {
          const response = await fetch(`/api/users/${user.id}/stats`);
          if (!response.ok) {
            throw new Error('Falha ao carregar estatísticas');
          }
          const data = await response.json();
          setStats(data);
        } catch (error) {
          console.error('Erro ao carregar estatísticas:', error);
        }
      };
      
      // Função para carregar histórico de partidas
      const loadMatchHistory = async () => {
        try {
          const response = await fetch(`/api/users/${user.id}/matches?limit=3`);
          if (!response.ok) {
            throw new Error('Falha ao carregar histórico de partidas');
          }
          const data = await response.json();
          setMatchHistory(data);
        } catch (error) {
          console.error('Erro ao carregar histórico de partidas:', error);
        }
      };
      
      // Função para carregar conquistas
      const loadAchievements = async () => {
        try {
          const response = await fetch(`/api/users/${user.id}/achievements?limit=3`);
          if (!response.ok) {
            throw new Error('Falha ao carregar conquistas');
          }
          const data = await response.json();
          setAchievements(data);
        } catch (error) {
          console.error('Erro ao carregar conquistas:', error);
        }
      };
      
      // Executar todas as requisições
      Promise.all([
        loadUserStats(),
        loadMatchHistory(),
        loadAchievements()
      ]).finally(() => {
        setIsDataLoading(false);
      });
    }
  }, [isAuthenticated, user?.id]);
  
  // Calcular progresso de XP para o próximo nível
  const xpProgress = (stats.xp / stats.nextLevelXp) * 100;
  
  // Componentes de ícones para as conquistas
  function Trophy() {
    return <Star className="text-yellow-500" size={18} />;
  }
  
  function Calendar() {
    return <Clock className="text-blue-500" size={18} />;
  }
  
  function Target() {
    return <Award className="text-purple-500" size={18} />;
  }
  
  // Obter ícone com base no tipo de conquista
  const getAchievementIcon = (type) => {
    switch (type) {
      case 'win_streak':
      case 'total_wins':
        return Trophy;
      case 'login_streak':
      case 'time_played':
        return Calendar;
      case 'matches_played':
      case 'target_score':
        return Target;
      default:
        return Trophy;
    }
  };
  
  // Formatar data relativa
  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return `${Math.floor(diffDays / 30)} meses atrás`;
  };
  
  // Verificar carregamento
  if (isLoading) {
    return (
      <Layout title="Carregando perfil...">
        <div className="container py-16">
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Renderizar perfil do usuário
  return (
    <Layout title={`Perfil de ${user?.username || 'Jogador'}`}>
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Perfil e Avatar 3D */}
          <div className="lg:col-span-1 space-y-6">
            {/* Informações básicas */}
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-card-hover p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-card-hover rounded-full flex items-center justify-center">
                      <User size={32} className="text-muted" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{user?.username || 'Jogador'}</h1>
                      <p className="text-muted">{user?.email || ''}</p>
                      {user?.userNumber && (
                        <p className="text-muted text-xs">ID: #{user.userNumber}</p>
                      )}
                    </div>
                  </div>
                  <Link href="/profile/edit" className="btn-secondary btn-sm flex items-center gap-1">
                    <Edit size={14} />
                    Editar
                  </Link>
                </div>
              </div>
              
              <div className="p-4">
                {/* Nível e XP */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Nível {stats.level}</span>
                    <span className="text-xs text-muted">{stats.xp}/{stats.nextLevelXp} XP</span>
                  </div>
                  <div className="w-full bg-card-hover rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${xpProgress}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Biografia do usuário */}
                <div className="mb-4">
                  <h3 className="text-md font-bold mb-2">Sobre mim</h3>
                  <p className="text-muted text-sm">
                    {user?.bio ? user.bio : "Este usuário ainda não adicionou uma biografia."}
                  </p>
                </div>
                
                {/* Redes Sociais */}
                {user?.socialLinks && Object.values(user.socialLinks).some(link => link) && (
                  <div className="mb-4">
                    <h3 className="text-md font-bold mb-2">Redes Sociais</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.socialLinks.instagram && (
                        <a href={`https://instagram.com/${user.socialLinks.instagram}`} 
                           target="_blank" rel="noopener noreferrer"
                           className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded text-xs">
                          Instagram
                        </a>
                      )}
                      {user.socialLinks.twitter && (
                        <a href={`https://twitter.com/${user.socialLinks.twitter}`} 
                           target="_blank" rel="noopener noreferrer"
                           className="px-2 py-1 bg-blue-500 rounded text-xs">
                          Twitter
                        </a>
                      )}
                      {user.socialLinks.facebook && (
                        <a href={user.socialLinks.facebook} 
                           target="_blank" rel="noopener noreferrer"
                           className="px-2 py-1 bg-blue-600 rounded text-xs">
                          Facebook
                        </a>
                      )}
                      {user.socialLinks.youtube && (
                        <a href={user.socialLinks.youtube} 
                           target="_blank" rel="noopener noreferrer"
                           className="px-2 py-1 bg-red-600 rounded text-xs">
                          YouTube
                        </a>
                      )}
                      {user.socialLinks.twitch && (
                        <a href={`https://twitch.tv/${user.socialLinks.twitch}`} 
                           target="_blank" rel="noopener noreferrer"
                           className="px-2 py-1 bg-purple-600 rounded text-xs">
                          Twitch
                        </a>
                      )}
                      {user.socialLinks.discord && (
                        <a href={user.socialLinks.discord} 
                           target="_blank" rel="noopener noreferrer"
                           className="px-2 py-1 bg-indigo-600 rounded text-xs">
                          Discord
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card-hover rounded-lg p-3">
                    <div className="text-xs text-muted mb-1">Partidas</div>
                    <div className="text-xl font-bold">{stats.matches}</div>
                  </div>
                  <div className="bg-card-hover rounded-lg p-3">
                    <div className="text-xs text-muted mb-1">Vitórias</div>
                    <div className="text-xl font-bold">{stats.wins}</div>
                  </div>
                  <div className="bg-card-hover rounded-lg p-3">
                    <div className="text-xs text-muted mb-1">Taxa de Vitória</div>
                    <div className="text-xl font-bold">{stats.winRate}%</div>
                  </div>
                  <div className="bg-card-hover rounded-lg p-3">
                    <div className="text-xs text-muted mb-1">Total Ganho</div>
                    <div className="text-xl font-bold text-primary">R$ {stats.totalEarnings.toFixed(2)}</div>
                  </div>
                </div>
                
                {/* Botões de Wallet */}
                <div className="mt-6 border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-bold mb-3">Carteira</h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href="/wallet" className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-medium text-center flex items-center justify-center gap-2">
                      <DollarSign size={16} />
                      Acessar Carteira
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visualizador 3D do personagem */}
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold">Seu Avatar</h2>
                  <Link href="/profile/customize" className="text-primary text-sm flex items-center gap-1">
                    Personalizar <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              
              <div className="h-80 bg-gradient-to-b from-card-hover to-card">
                <CharacterViewer 
                  skinId={user?.activeSkin || 'default'} 
                  animation="idle"
                  controls={true}
                  autoRotate={false}
                  background="transparent"
                  height="100%"
                  quality="high"
                />
              </div>
              
              <div className="p-4 bg-card-hover">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">
                      Skin atual: <span className="text-primary">{user?.activeSkin || 'Padrão'}</span>
                    </div>
                    <div className="text-xs text-muted mt-1">
                      {user?.ownedSkins?.length || 1} skins desbloqueadas
                    </div>
                  </div>
                  <Link href="/store/skins" className="btn-primary btn-sm flex items-center gap-1">
                    <DollarSign size={14} />
                    Loja
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Conquistas Recentes */}
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold">Conquistas Recentes</h2>
                  <Link href="/profile/achievements" className="text-primary text-sm flex items-center gap-1">
                    Ver todas <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              
              <div className="divide-y divide-border">
                {isDataLoading ? (
                  <div className="p-8 flex justify-center items-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : achievements.length > 0 ? (
                  achievements.map((achievement) => {
                    const AchievementIcon = getAchievementIcon(achievement.type);
                    return (
                      <div key={achievement.id} className="p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-card-hover rounded-full flex items-center justify-center">
                          <AchievementIcon />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{achievement.name}</div>
                          <div className="text-xs text-muted">{formatRelativeDate(achievement.unlockedAt)}</div>
                        </div>
                        <div className="text-primary font-bold text-sm">
                          +{achievement.xpReward} XP
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-muted">
                    <div className="mb-2">
                      <Award size={24} className="mx-auto opacity-50" />
                    </div>
                    <p>Nenhuma conquista desbloqueada ainda.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Histórico de Partidas */}
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold">Histórico de Partidas</h2>
                  <Link href="/profile/history" className="text-primary text-sm flex items-center gap-1">
                    Ver todos <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              
              <div className="divide-y divide-border">
                {isDataLoading ? (
                  <div className="p-8 flex justify-center items-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : matchHistory.length > 0 ? (
                  matchHistory.map((match) => {
                    const isWin = match.result === 'win';
                    return (
                      <div key={match.id} className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isWin ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="font-medium">{isWin ? 'Vitória' : 'Derrota'}</span>
                          </div>
                          <div className="text-xs text-muted">
                            {new Date(match.date).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm">
                            Partida #{match.id} • {isWin ? '+' : '-'}R$ {match.amount.toFixed(2)}
                          </div>
                          <Link href={`/matches/${match.id}`} className="text-primary text-xs">
                            Detalhes
                          </Link>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-muted">
                    <div className="mb-2">
                      <Clock size={24} className="mx-auto opacity-50" />
                    </div>
                    <p>Nenhuma partida jogada ainda.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Estatísticas Detalhadas */}
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-bold">Estatísticas Detalhadas</h2>
              </div>
              
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card-hover rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">Melhor Resultado</div>
                  <div className="text-xl font-bold">{stats.bestResult || '-'}</div>
                </div>
                <div className="bg-card-hover rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">Pontuação Média</div>
                  <div className="text-xl font-bold">{stats.averageScore?.toFixed(1) || '-'}</div>
                </div>
                <div className="bg-card-hover rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">Maior Ganho</div>
                  <div className="text-xl font-bold text-primary">
                    {stats.highestEarning ? `R$ ${stats.highestEarning.toFixed(2)}` : '-'}
                  </div>
                </div>
                <div className="bg-card-hover rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">Sequência de Vitórias</div>
                  <div className="text-xl font-bold">{stats.winStreak || '0'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 