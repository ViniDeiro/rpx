'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Users, DollarSign, Calendar, 
  AlertTriangle, CheckCircle, ArrowUp, ArrowDown,
  Activity, Clock, UserCheck, User, Package, Shield, Settings
} from 'react-feather';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Definição de tipos para os dados
interface Match {
  id: string;
  game: string;
  status: string;
  value: number;
  date: string;
}

interface UserData {
  id: string;
  username: string;
  verified: boolean;
  joinDate: string;
  email?: string;
  role?: string;
  isAdmin?: boolean;
  status?: string;
}

interface StatsData {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  completedMatches: number;
  totalTransactions: number;
  pendingVerifications: number;
  platformBalance: number;
  recentMatches: Match[];
  recentUsers: UserData[];
  adminUsers: UserData[];
  playerUsers: UserData[];
  isLoading: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalMatches: 0,
    completedMatches: 0,
    totalTransactions: 0,
    pendingVerifications: 0,
    platformBalance: 0,
    recentMatches: [],
    recentUsers: [],
    adminUsers: [],
    playerUsers: [],
    isLoading: true
  });

  const [activeTab, setActiveTab] = useState<'admin' | 'players'>('admin');
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Obter token de autenticação
  useEffect(() => {
    // Recuperar token do localStorage ou cookies
    const token = localStorage.getItem('auth_token') || document.cookie.replace(/(?:(?:^|.*;\s*)auth_token\s*=\s*([^;]*).*$)|^.*$/, "$1");
    setAuthToken(token);
  }, []);

  // Busca dados reais da API
  useEffect(() => {
    const fetchDataFromAPI = async () => {
      try {
        setError(null);
        
        // Verifica se tem autenticação
        if (!authToken) {
          setError("Token de autenticação não encontrado. Faça login novamente.");
          return;
        }

        // Headers com autenticação
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        };
        
        // Buscar perfil do usuário atual
        let currentUser = null;
        try {
          const profileResponse = await fetch('/api/users/profile', { headers });
          if (profileResponse.ok) {
            currentUser = await profileResponse.json();
            console.log("Perfil do usuário:", currentUser);
          } else {
            console.warn("Erro ao buscar perfil:", profileResponse.status);
          }
        } catch (profileError) {
          console.warn("Erro ao buscar perfil:", profileError);
        }
        
        // Arrays para armazenar os usuários
        let adminUsers: UserData[] = [];
        let playerUsers: UserData[] = [];
        
        // Se conseguimos obter o perfil do usuário, adicione-o à lista adequada
        if (currentUser) {
          const userData = {
            id: currentUser._id || currentUser.id,
            username: currentUser.username,
            verified: currentUser.verified || currentUser.status === 'ativo',
            joinDate: currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida',
            email: currentUser.email || currentUser.contact?.email,
            role: currentUser.role || (currentUser.isAdmin ? 'admin' : 'player'),
            isAdmin: currentUser.isAdmin || currentUser.role === 'admin',
            status: currentUser.status
          };
          
          if (userData.isAdmin) {
            adminUsers.push(userData);
          } else {
            playerUsers.push(userData);
          }
        }
        
        // Tente buscar usuários da API de administração
        try {
          const adminsResponse = await fetch('/api/admin/users', { headers });
          if (adminsResponse.ok) {
            const usersData = await adminsResponse.json();
            console.log("Dados de usuários (admin):", usersData);
            
            // Filtrar administradores e jogadores
            adminUsers = usersData
              .filter((user: any) => user.role === 'admin' || user.isAdmin)
              .map((admin: any) => ({
                id: admin._id || admin.id,
                username: admin.username,
                verified: admin.verified || admin.status === 'ativo',
                joinDate: admin.createdAt ? new Date(admin.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida',
                email: admin.email || admin.contact?.email,
                role: admin.role || 'admin',
                isAdmin: true,
                status: admin.status
              }));
              
            playerUsers = usersData
              .filter((user: any) => user.role === 'player' || (!user.isAdmin && user.role !== 'admin'))
              .map((player: any) => ({
                id: player._id || player.id,
                username: player.username,
                verified: player.verified || player.status === 'ativo',
                joinDate: player.createdAt ? new Date(player.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida',
                email: player.email || player.contact?.email,
                role: player.role || 'player',
                isAdmin: false,
                status: player.status
              }));
          } else {
            console.warn("Erro ao buscar usuários do admin:", adminsResponse.status);
          }
        } catch (usersError) {
          console.warn("Erro ao buscar usuários do admin:", usersError);
        }
        
        // Preencher com dados de exemplo se não conseguimos obter dados reais
        if (adminUsers.length === 0) {
          adminUsers.push({
            id: 'admin-1',
            username: 'Admin Principal',
            verified: true,
            joinDate: '31/12/2022',
            role: 'admin',
            isAdmin: true,
            status: 'ativo'
          });
        }
        
        if (playerUsers.length === 0) {
          const examplePlayers = [
            { id: 'P1', username: 'João Silva', verified: true, joinDate: '14/10/2023', email: 'joao.silva@email.com', role: 'player', isAdmin: false, status: 'ativo' },
            { id: 'P2', username: 'Maria Oliveira', verified: true, joinDate: '19/11/2023', email: 'maria.oliveira@email.com', role: 'player', isAdmin: false, status: 'ativo' },
            { id: 'P3', username: 'Pedro Santos', verified: false, joinDate: '09/12/2023', email: 'pedro.santos@email.com', role: 'player', isAdmin: false, status: 'bloqueado' },
            { id: 'P4', username: 'Ana Ferreira', verified: false, joinDate: '04/01/2024', email: 'ana.ferreira@email.com', role: 'player', isAdmin: false, status: 'inativo' },
            { id: 'P5', username: 'Carlos Mendes', verified: true, joinDate: '17/02/2024', email: 'carlos.mendes@email.com', role: 'player', isAdmin: false, status: 'ativo' },
            { id: 'P6', username: 'Lúcia Pereira', verified: true, joinDate: '29/02/2024', email: 'lucia.pereira@email.com', role: 'player', isAdmin: false, status: 'ativo' }
          ];
          playerUsers = examplePlayers;
        }
        
        // Buscar estatísticas gerais - alternativa: gerar estatísticas a partir dos dados que temos
        let statsData = {
          totalUsers: adminUsers.length + playerUsers.length,
          activeUsers: [...adminUsers, ...playerUsers].filter((user: any) => user.status === 'ativo' || user.verified).length,
          totalMatches: 42,
          completedMatches: 36,
          totalTransactions: 128,
          pendingVerifications: [...adminUsers, ...playerUsers].filter((user: any) => !user.verified && user.status !== 'ativo').length,
          platformBalance: 12500.00
        };
        
        try {
          const statsResponse = await fetch('/api/admin/stats', { headers });
          if (statsResponse.ok) {
            statsData = await statsResponse.json();
          }
        } catch (statsError) {
          console.warn("Erro ao buscar estatísticas, usando dados calculados:", statsError);
        }
        
        // Buscar partidas recentes ou usar dados de exemplo
        let matchesData: any[] = [
          { id: 'MATCH-1234', game: 'Fortnite', status: 'completed', value: 120, createdAt: '2024-04-12T10:00:00' },
          { id: 'MATCH-1235', game: 'CS:GO', status: 'in_progress', value: 250, createdAt: '2024-04-12T14:30:00' },
          { id: 'MATCH-1236', game: 'League of Legends', status: 'disputed', value: 100, createdAt: '2024-04-11T18:45:00' },
          { id: 'MATCH-1237', game: 'Valorant', status: 'completed', value: 200, createdAt: '2024-04-11T20:15:00' },
        ];
        
        try {
          const matchesResponse = await fetch('/api/admin/matches/recent', { headers });
          if (matchesResponse.ok) {
            matchesData = await matchesResponse.json();
          } else {
            console.warn("Erro ao buscar partidas:", matchesResponse.status);
          }
        } catch (matchError) {
          console.warn("Erro ao buscar partidas:", matchError);
        }

        // Processar dados de partidas para o formato esperado
        const formattedMatches = matchesData.map((match: any) => ({
          id: match._id || match.id,
          game: match.game || match.gameType || 'Não especificado',
          status: match.status,
          value: match.value || match.betAmount || 0,
          date: match.createdAt ? new Date(match.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida'
        }));

        setStats({
          totalUsers: statsData.totalUsers || (adminUsers.length + playerUsers.length),
          activeUsers: statsData.activeUsers || 0,
          totalMatches: statsData.totalMatches || 0,
          completedMatches: statsData.completedMatches || 0,
          totalTransactions: statsData.totalTransactions || 0,
          pendingVerifications: statsData.pendingVerifications || 0,
          platformBalance: statsData.platformBalance || 0,
          recentMatches: formattedMatches,
          recentUsers: [...adminUsers, ...playerUsers].slice(0, 4),
          adminUsers,
          playerUsers,
          isLoading: false
        });
        
      } catch (error) {
        console.error("Erro ao carregar dados da API:", error);
        setError(`Não foi possível carregar os dados do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        
        // Usar dados da imagem fornecida como exemplo
        const adminUsers = [
          { id: 'A1', username: 'Admin Principal', verified: true, joinDate: '31/12/2022', email: 'admin@rpx.com', role: 'admin', isAdmin: true, status: 'ativo' },
          { id: 'A2', username: 'Moderador Sistema', verified: true, joinDate: '11/05/2023', email: 'moderador@rpx.com', role: 'admin', isAdmin: true, status: 'ativo' },
        ];
        
        const playerUsers = [
          { id: 'P1', username: 'João Silva', verified: true, joinDate: '14/10/2023', email: 'joao.silva@email.com', role: 'player', isAdmin: false, status: 'ativo' },
          { id: 'P2', username: 'Maria Oliveira', verified: true, joinDate: '19/11/2023', email: 'maria.oliveira@email.com', role: 'player', isAdmin: false, status: 'ativo' },
          { id: 'P3', username: 'Pedro Santos', verified: false, joinDate: '09/12/2023', email: 'pedro.santos@email.com', role: 'player', isAdmin: false, status: 'bloqueado' },
          { id: 'P4', username: 'Ana Ferreira', verified: false, joinDate: '04/01/2024', email: 'ana.ferreira@email.com', role: 'player', isAdmin: false, status: 'inativo' },
          { id: 'P5', username: 'Carlos Mendes', verified: true, joinDate: '17/02/2024', email: 'carlos.mendes@email.com', role: 'player', isAdmin: false, status: 'ativo' },
          { id: 'P6', username: 'Lúcia Pereira', verified: true, joinDate: '29/02/2024', email: 'lucia.pereira@email.com', role: 'player', isAdmin: false, status: 'ativo' }
        ];
        
        setStats({
          totalUsers: adminUsers.length + playerUsers.length,
          activeUsers: 6,
          totalMatches: 42,
          completedMatches: 36,
          totalTransactions: 128,
          pendingVerifications: 2,
          platformBalance: 12500.00,
          recentMatches: [
            { id: 'MATCH-1234', game: 'Fortnite', status: 'completed', value: 120, date: '12/04/2024' },
            { id: 'MATCH-1235', game: 'CS:GO', status: 'in_progress', value: 250, date: '12/04/2024' },
            { id: 'MATCH-1236', game: 'League of Legends', status: 'disputed', value: 100, date: '11/04/2024' },
            { id: 'MATCH-1237', game: 'Valorant', status: 'completed', value: 200, date: '11/04/2024' },
          ],
          recentUsers: [...adminUsers, ...playerUsers].slice(0, 4),
          adminUsers,
          playerUsers,
          isLoading: false
        });
      }
    };

    // Só faz a chamada se tiver token de autenticação
    if (authToken) {
      fetchDataFromAPI();
    } else {
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [authToken]);

  if (stats.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">Carregando dados do painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-600 mt-1">Bem-vindo ao painel de administração da RPX Platform</p>
      </header>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
          {!authToken && (
            <div className="mt-2">
              <a href="/login" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                Fazer login novamente
              </a>
            </div>
          )}
        </div>
      )}

      {/* Cartões de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-6 w-6 text-purple-600 mr-2" />
              <span className="text-2xl font-bold">{stats.totalUsers}</span>
              <span className="ml-2 text-xs text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />12%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.activeUsers} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Partidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Activity className="h-6 w-6 text-purple-600 mr-2" />
              <span className="text-2xl font-bold">{stats.totalMatches}</span>
              <span className="ml-2 text-xs text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />8%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{stats.completedMatches} completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-purple-600 mr-2" />
              <span className="text-2xl font-bold">{stats.totalTransactions}</span>
              <span className="ml-2 text-xs text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />15%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">R$ {stats.platformBalance.toFixed(2)} em saldo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Verificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              <span className="text-2xl font-bold">{stats.pendingVerifications}</span>
              <span className="ml-2 text-xs text-red-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />5
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Pendentes de revisão</p>
          </CardContent>
        </Card>
      </div>

      {/* Nova seção: Administração Rápida */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Administração Rápida</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Gerenciar Salas</h3>
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600 mb-4">Crie, edite ou remova salas de jogos. Configure regras e limites para cada sala.</p>
              <a href="/admin/salas" className="inline-block px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium">
                Acessar Salas
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Moderação</h3>
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-sm text-gray-600 mb-4">Revise denúncias, gerencie disputas abertas e modere o comportamento dos usuários.</p>
              <a href="/admin/moderacao" className="inline-block px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm font-medium">
                Acessar Moderação
              </a>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Sistema</h3>
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mb-4">Configure parâmetros do sistema, visualize logs e gerencie serviços da plataforma.</p>
              <a href="/admin/sistema" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                Configurações do Sistema
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Partidas Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Partidas Recentes</h2>
          <Card>
            <CardContent className="p-0">
              {stats.recentMatches.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">ID</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Jogo</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentMatches.map((match, index) => (
                      <tr key={match.id} className={index < stats.recentMatches.length - 1 ? "border-b" : ""}>
                        <td className="px-4 py-3 text-sm text-gray-800">{match.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{match.game}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs 
                            ${match.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              match.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {match.status === 'completed' ? 'Completada' : 
                             match.status === 'in_progress' ? 'Em Progresso' : 'Disputada'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">R$ {match.value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Nenhuma partida recente encontrada
                </div>
              )}
              <div className="p-4 border-t">
                <a href="/admin/partidas" className="text-purple-600 text-sm font-medium hover:text-purple-800">
                  Ver todas as partidas →
                </a>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Usuários</h2>
            <div className="flex bg-gray-100 rounded-lg overflow-hidden">
              <button 
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'admin' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Administradores
              </button>
              <button 
                onClick={() => setActiveTab('players')}
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'players' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'}`}
              >
                Jogadores
              </button>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              {(activeTab === 'admin' ? stats.adminUsers : stats.playerUsers).length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Usuário</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Data</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'admin' ? stats.adminUsers : stats.playerUsers).map((user, index) => (
                      <tr key={user.id} className={index < (activeTab === 'admin' ? stats.adminUsers.length : stats.playerUsers.length) - 1 ? "border-b" : ""}>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <div className={`h-8 w-8 rounded-full ${user.isAdmin ? 'bg-blue-100' : 'bg-purple-100'} flex items-center justify-center mr-3`}>
                              <User className={`h-4 w-4 ${user.isAdmin ? 'text-blue-600' : 'text-purple-600'}`} />
                            </div>
                            <span className="font-medium text-gray-800">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.joinDate}</td>
                        <td className="px-4 py-3 text-sm">
                          {user.verified ? (
                            <span className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" /> Verificado
                            </span>
                          ) : (
                            <span className="flex items-center text-orange-500">
                              <Clock className="h-4 w-4 mr-1" /> Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  Nenhum {activeTab === 'admin' ? 'administrador' : 'jogador'} encontrado
                </div>
              )}
              <div className="p-4 border-t">
                <a href={activeTab === 'admin' ? "/admin/administradores" : "/admin/jogadores"} className="text-purple-600 text-sm font-medium hover:text-purple-800">
                  Ver todos os {activeTab === 'admin' ? 'administradores' : 'jogadores'} →
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
} 