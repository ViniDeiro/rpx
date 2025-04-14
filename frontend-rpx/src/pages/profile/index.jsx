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
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/profile');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Carregar estatísticas do usuário (simulado)
  useEffect(() => {
    if (isAuthenticated) {
      // Dados simulados - Em produção, isso viria da API
      const mockStats = {
        matches: 127,
        wins: 48,
        totalEarnings: 1875.50,
        winRate: 37.8,
        level: 23,
        xp: 7800,
        nextLevelXp: 8500,
      };
      
      setStats(mockStats);
    }
  }, [isAuthenticated]);
  
  // Calcular progresso de XP para o próximo nível
  const xpProgress = (stats.xp / stats.nextLevelXp) * 100;
  
  // Dados simulados de conquistas recentes
  const recentAchievements = [
    { name: 'Primeiras 10 vitórias', icon: Trophy, date: '2 dias atrás', xp: 500 },
    { name: 'Registrar 3 dias seguidos', icon: Calendar, date: '3 dias atrás', xp: 150 },
    { name: 'Completar 50 partidas', icon: Target, date: '5 dias atrás', xp: 300 },
  ];
  
  // Componentes de ícones simulados para as conquistas
  function Trophy() {
    return <Star className="text-yellow-500" size={18} />;
  }
  
  function Calendar() {
    return <Clock className="text-blue-500" size={18} />;
  }
  
  function Target() {
    return <Award className="text-purple-500" size={18} />;
  }
  
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
                    <Link href="/profile/wallet" className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md font-medium text-center flex items-center justify-center gap-2">
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
                {recentAchievements.map((achievement, index) => (
                  <div key={index} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-card-hover rounded-full flex items-center justify-center">
                      <achievement.icon />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-xs text-muted">{achievement.date}</div>
                    </div>
                    <div className="text-primary font-bold text-sm">
                      +{achievement.xp} XP
                    </div>
                  </div>
                ))}
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
                {/* Partidas simuladas */}
                {Array(3).fill(0).map((_, index) => {
                  const isWin = index % 2 === 0;
                  return (
                    <div key={index} className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isWin ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="font-medium">{isWin ? 'Vitória' : 'Derrota'}</span>
                        </div>
                        <div className="text-xs text-muted">
                          {new Date(Date.now() - (index + 1) * 86400000).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm">
                          Partida #{123 - index} • {isWin ? '+' : '-'}R$ {(Math.random() * 100).toFixed(2)}
                        </div>
                        <Link href={`/matches/${100 + index}`} className="text-primary text-xs">
                          Detalhes
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Estatísticas Detalhadas */}
            <div className="bg-card rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="font-bold">Estatísticas Detalhadas</h2>
              </div>
              
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Estatísticas simuladas */}
                <div className="bg-card-hover rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">Melhor Resultado</div>
                  <div className="text-xl font-bold">1º Lugar</div>
                </div>
                <div className="bg-card-hover rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">Pontuação Média</div>
                  <div className="text-xl font-bold">2.8</div>
                </div>
                <div className="bg-card-hover rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">Maior Ganho</div>
                  <div className="text-xl font-bold text-primary">R$ 250,00</div>
                </div>
                <div className="bg-card-hover rounded-lg p-3">
                  <div className="text-xs text-muted mb-1">Sequência de Vitórias</div>
                  <div className="text-xl font-bold">3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 