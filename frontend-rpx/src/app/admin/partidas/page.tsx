'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Edit2, Trash2, Search, ChevronUp, ChevronDown, Copy, Eye, 
  Calendar, Users, DollarSign, Clock, Tag, Lock, Save, X, CheckCircle, AlertCircle 
} from 'react-feather';
import Link from 'next/link';

// Definir a interface para Match
interface Match {
  id: number;
  name: string;
  format: string;
  entry: number;
  prize: number;
  status: string;
  startTime: string;
  players: number;
  maxPlayers: number;
  roomId: string;
  roomPassword: string;
  configuredRoom: boolean;
  isOfficialRoom: boolean;  // Novo campo para indicar se é uma sala oficial
  gameType: 'solo' | 'duo' | 'squad'; // Novo campo para tipo de jogo
  roomCapacity: number; // Novo campo para capacidade da sala
  gameDetails: {  // Novo objeto com detalhes do jogo
    gameName: string; // Nome do jogo (ex: Free Fire, PUBG, etc)
    gameMode: string; // Modo do jogo (ex: Battle Royale, Team Deathmatch)
    mapName: string; // Nome do mapa
    serverRegion: string; // Região do servidor
  };
  [key: string]: any; // Permite acesso indexado para ordenação
}

// Dados iniciais para simulação
const initialMatches: Match[] = [
  { 
    id: 1, 
    name: 'Partida 1', 
    format: 'Squad (4x4)',
    gameType: 'squad',
    entry: 3.00,
    prize: 6.00,
    status: 'em_espera',
    startTime: '2023-05-15T19:30:00',
    players: 12,
    maxPlayers: 16,
    roomId: 'RPX62336',
    roomPassword: 'pass505',
    configuredRoom: true,
    isOfficialRoom: true,
    roomCapacity: 16,
    gameDetails: {
      gameName: 'Free Fire',
      gameMode: 'Battle Royale',
      mapName: 'Bermuda',
      serverRegion: 'Brasil'
    }
  },
  { 
    id: 2, 
    name: 'Partida 2', 
    format: 'Dupla (2x2)',
    gameType: 'duo',
    entry: 5.00,
    prize: 20.00,
    status: 'em_breve',
    startTime: '2023-05-15T20:30:00',
    players: 6,
    maxPlayers: 10,
    roomId: '',
    roomPassword: '',
    configuredRoom: false,
    isOfficialRoom: false,
    roomCapacity: 10,
    gameDetails: {
      gameName: '',
      gameMode: '',
      mapName: '',
      serverRegion: ''
    }
  },
  { 
    id: 3, 
    name: 'Partida 3', 
    format: 'Solo',
    gameType: 'solo',
    entry: 2.50,
    prize: 10.00,
    status: 'em_andamento',
    startTime: '2023-05-15T18:00:00',
    players: 8,
    maxPlayers: 8,
    roomId: 'RPX75432',
    roomPassword: 'pass123',
    configuredRoom: true,
    isOfficialRoom: true,
    roomCapacity: 8,
    gameDetails: {
      gameName: '',
      gameMode: '',
      mapName: '',
      serverRegion: ''
    }
  },
  { 
    id: 4, 
    name: 'Partida 4', 
    format: 'Squad (4x4)',
    gameType: 'squad',
    entry: 3.00,
    prize: 6.00,
    status: 'em_espera',
    startTime: '2023-05-15T21:30:00',
    players: 8,
    maxPlayers: 16,
    roomId: 'RPX62336',
    roomPassword: 'pass505',
    configuredRoom: true,
    isOfficialRoom: true,
    roomCapacity: 16,
    gameDetails: {
      gameName: 'Free Fire',
      gameMode: 'Battle Royale',
      mapName: 'Bermuda',
      serverRegion: 'Brasil'
    }
  },
  { 
    id: 5, 
    name: 'Partida 5', 
    format: 'Dupla (2x2)',
    gameType: 'duo',
    entry: 10.00,
    prize: 50.00,
    status: 'finalizada',
    startTime: '2023-05-15T17:00:00',
    players: 10,
    maxPlayers: 10,
    roomId: 'RPX12345',
    roomPassword: 'oldpass',
    configuredRoom: true,
    isOfficialRoom: false,
    roomCapacity: 10,
    gameDetails: {
      gameName: '',
      gameMode: '',
      mapName: '',
      serverRegion: ''
    }
  }
];

// Componente principal
export default function AdminPartidas() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [roomConfigModalOpen, setRoomConfigModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados da API
  useEffect(() => {
    const fetchSalas = async () => {
      setIsLoading(true);
      try {
        // Obter o token de autenticação
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          throw new Error('Token de autenticação não encontrado. Faça login novamente.');
        }
        
        const response = await fetch('/api/admin/salas', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          throw new Error('Não autorizado. Faça login como administrador.');
        }
        
        if (!response.ok) {
          throw new Error(`Falha ao carregar as salas. Status: ${response.status}`);
        }
        
        const data = await response.json();
        setMatches(data.data || []);
        setFilteredMatches(data.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao buscar salas:', err);
        setError(err.message || 'Não foi possível carregar as salas. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalas();
  }, []);

  // Ordenação e filtragem
  useEffect(() => {
    let filtered = [...matches];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(match => 
        match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.format.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.roomId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(match => match.status === filterStatus);
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredMatches(filtered);
  }, [matches, searchTerm, sortField, sortDirection, filterStatus]);

  // Função para ordenar
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para editar partida
  const handleEditMatch = (match: Match) => {
    setCurrentMatch({...match});
    setIsModalOpen(true);
  };

  // Função para salvar partida
  const handleSaveMatch = async () => {
    if (currentMatch) {
      try {
        // Obter o token de autenticação
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          throw new Error('Token de autenticação não encontrado. Faça login novamente.');
        }
        
        let response;
        let updatedMatches;

        if (currentMatch.id) {
          // Editar partida existente
          response = await fetch('/api/admin/salas', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(currentMatch),
          });

          if (!response.ok) {
            throw new Error('Falha ao atualizar a sala');
          }

          const updatedSala = await response.json();
          updatedMatches = matches.map(m => m.id === updatedSala.id ? updatedSala : m);
        } else {
          // Adicionar nova partida
          response = await fetch('/api/admin/salas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              ...currentMatch,
              configuredRoom: !!currentMatch.roomId
            }),
          });

          if (!response.ok) {
            throw new Error('Falha ao criar a sala');
          }

          const newSala = await response.json();
          updatedMatches = [...matches, newSala];
        }

        setMatches(updatedMatches);
        setSuccessMessage('Sala salva com sucesso!');
        setTimeout(() => setSuccessMessage(''), 3000);
        setIsModalOpen(false);
        setCurrentMatch(null);
      } catch (err) {
        console.error('Erro ao salvar sala:', err);
        alert('Ocorreu um erro ao salvar a sala. Tente novamente.');
      }
    }
  };

  // Função para excluir partida
  const handleDeleteMatch = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta partida?')) {
      try {
        // Obter o token de autenticação
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          throw new Error('Token de autenticação não encontrado. Faça login novamente.');
        }
        
        const response = await fetch(`/api/admin/salas?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          throw new Error('Não autorizado. Faça login como administrador.');
        }

        if (!response.ok) {
          throw new Error('Falha ao excluir a partida');
        }

        // Atualizar estado
        setMatches(prevMatches => prevMatches.filter(match => match.id !== id));
        setSuccessMessage('Partida excluída com sucesso!');
        
        // Limpar mensagem após 3 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (error) {
        console.error('Erro ao excluir partida:', error);
        alert('Erro ao excluir partida. Tente novamente.');
      }
    }
  };

  // Função para abrir modal de nova partida
  const handleNewMatch = () => {
    setCurrentMatch({ 
      id: 0,
      name: '', 
      format: 'Squad (4x4)',
      gameType: 'squad',
      entry: 3.00,
      prize: 6.00,
      status: 'em_breve',
      startTime: new Date().toISOString().slice(0, 16),
      players: 0,
      maxPlayers: 16,
      roomId: '',
      roomPassword: '',
      configuredRoom: false,
      isOfficialRoom: false,
      roomCapacity: 16,
      gameDetails: {
        gameName: 'Free Fire',
        gameMode: 'Battle Royale',
        mapName: 'Bermuda',
        serverRegion: 'Brasil'
      }
    });
    setIsModalOpen(true);
  };

  // Função para configurar sala
  const handleConfigureRoom = (match: Match) => {
    setCurrentMatch({...match});
    setRoomConfigModalOpen(true);
  };

  // Função para salvar configuração de sala
  const handleSaveRoomConfig = async () => {
    if (currentMatch) {
      try {
        // Obter o token de autenticação
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          throw new Error('Token de autenticação não encontrado. Faça login novamente.');
        }
        
        const response = await fetch('/api/admin/salas', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...currentMatch,
            configuredRoom: true
          }),
        });

        if (!response.ok) {
          throw new Error('Falha ao atualizar configuração da sala');
        }

        const updatedData = await response.json();

        // Atualizar a lista de partidas
        setMatches(prev => 
          prev.map(m => m.id === currentMatch.id ? updatedData.data : m)
        );

        // Fechar modal
        setRoomConfigModalOpen(false);
        
        // Exibir mensagem de sucesso
        setSuccessMessage('Configuração da sala salva com sucesso!');
        
        // Limpar mensagem após 3 segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (error) {
        console.error('Erro ao configurar sala:', error);
        alert('Erro ao configurar sala. Tente novamente.');
      }
    }
  };

  // Função para copiar ID ou senha da sala
  const handleCopyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage(`${type} copiado para a área de transferência!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Helper para formatar datas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Helper para traduzir status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_espera': return { label: 'Aguardando jogadores', color: 'bg-yellow-100 text-yellow-800' };
      case 'em_breve': return { label: 'Em breve', color: 'bg-blue-100 text-blue-800' };
      case 'em_andamento': return { label: 'Em andamento', color: 'bg-green-100 text-green-800' };
      case 'finalizada': return { label: 'Finalizada', color: 'bg-gray-100 text-gray-800' };
      case 'cancelada': return { label: 'Cancelada', color: 'bg-red-100 text-red-800' };
      default: return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Helper para gerar ID de sala automático
  const generateRoomId = () => {
    return `RPX${Math.floor(10000 + Math.random() * 90000)}`;
  };
  
  // Helper para gerar senha de sala automática
  const generateRoomPassword = () => {
    return `pass${Math.floor(100 + Math.random() * 900)}`;
  };

  // Renderizar loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-center text-gray-600">Carregando salas...</p>
        </div>
      </div>
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={() => window.location.reload()}
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Partidas</h1>
        <button
          onClick={handleNewMatch}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <PlusCircle size={18} className="mr-2" />
          Nova Partida
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar partida..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-purple-500 focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500 w-full md:w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="em_espera">Aguardando jogadores</option>
              <option value="em_breve">Em breve</option>
              <option value="em_andamento">Em andamento</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md flex items-center shadow-md z-50">
          <CheckCircle size={18} className="mr-2" />
          {successMessage}
        </div>
      )}

      {/* Tabela de Partidas */}
      <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    ID
                    {sortField === 'id' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Nome
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Formato
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Entrada/Prêmio
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Sala
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMatches.map((match) => {
                const status = getStatusLabel(match.status);
                return (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{match.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {match.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {match.format}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Entrada: {formatCurrency(match.entry)}</div>
                      <div>Prêmio: {formatCurrency(match.prize)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {match.configuredRoom ? (
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center">
                            <Tag size={14} className="mr-1 text-gray-400" />
                            <span className="mr-2 font-medium">{match.roomId}</span>
                            <button
                              onClick={() => handleCopyToClipboard(match.roomId, 'ID da sala')}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                          <div className="flex items-center">
                            <Lock size={14} className="mr-1 text-gray-400" />
                            <span className="mr-2 font-medium">{match.roomPassword}</span>
                            <button
                              onClick={() => handleCopyToClipboard(match.roomPassword, 'Senha da sala')}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleConfigureRoom(match)}
                          className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                        >
                          Configurar Sala
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditMatch(match)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar partida"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleConfigureRoom(match)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Configurar sala"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteMatch(match.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir partida"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMatches.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma partida encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição/Criação de Partida */}
      {isModalOpen && currentMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {currentMatch.id ? `Editar Partida #${currentMatch.id}` : 'Nova Partida'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Partida</label>
                  <input
                    type="text"
                    className="px-3 py-2 border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
                    value={currentMatch.name}
                    onChange={(e) => setCurrentMatch({...currentMatch, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
                    value={currentMatch.format}
                    onChange={(e) => setCurrentMatch({...currentMatch, format: e.target.value})}
                  >
                    <option value="Solo">Solo</option>
                    <option value="Dupla (2x2)">Dupla (2x2)</option>
                    <option value="Squad (4x4)">Squad (4x4)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor de Entrada (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="px-3 py-2 border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
                    value={currentMatch.entry}
                    onChange={(e) => setCurrentMatch({...currentMatch, entry: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Prêmio (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="px-3 py-2 border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
                    value={currentMatch.prize}
                    onChange={(e) => setCurrentMatch({...currentMatch, prize: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora de Início</label>
                  <input
                    type="datetime-local"
                    className="px-3 py-2 border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
                    value={currentMatch.startTime}
                    onChange={(e) => setCurrentMatch({...currentMatch, startTime: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
                    value={currentMatch.status}
                    onChange={(e) => setCurrentMatch({...currentMatch, status: e.target.value})}
                  >
                    <option value="em_breve">Em breve</option>
                    <option value="em_espera">Aguardando jogadores</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="finalizada">Finalizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número Máximo de Jogadores</label>
                  <input
                    type="number"
                    min="1"
                    className="px-3 py-2 border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
                    value={currentMatch.maxPlayers}
                    onChange={(e) => setCurrentMatch({...currentMatch, maxPlayers: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jogadores Inscritos</label>
                  <input
                    type="number"
                    min="0"
                    className="px-3 py-2 border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
                    value={currentMatch.players}
                    onChange={(e) => setCurrentMatch({...currentMatch, players: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
                <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                  <Eye size={16} className="mr-2" />
                  Configuração da Sala
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID da Sala</label>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Ex: RPX12345"
                        className="px-3 py-2 border border-gray-300 rounded-l-md w-full focus:ring-purple-500 focus:border-purple-500"
                        value={currentMatch.roomId}
                        onChange={(e) => setCurrentMatch({...currentMatch, roomId: e.target.value})}
                      />
                      {currentMatch.roomId && (
                        <button
                          onClick={() => handleCopyToClipboard(currentMatch.roomId, 'ID da sala')}
                          className="bg-gray-100 hover:bg-gray-200 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md"
                          title="Copiar ID"
                        >
                          <Copy size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha da Sala</label>
                    <div className="flex">
                      <input
                        type="text"
                        placeholder="Ex: pass123"
                        className="px-3 py-2 border border-gray-300 rounded-l-md w-full focus:ring-purple-500 focus:border-purple-500"
                        value={currentMatch.roomPassword}
                        onChange={(e) => setCurrentMatch({...currentMatch, roomPassword: e.target.value})}
                      />
                      {currentMatch.roomPassword && (
                        <button
                          onClick={() => handleCopyToClipboard(currentMatch.roomPassword, 'Senha da sala')}
                          className="bg-gray-100 hover:bg-gray-200 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md"
                          title="Copiar senha"
                        >
                          <Copy size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMatch}
                className="px-4 py-2 bg-purple-600 rounded-md text-white hover:bg-purple-700"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração de Sala */}
      {roomConfigModalOpen && currentMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Configurar Sala - {currentMatch.name}
              </h3>
              <button 
                onClick={() => setRoomConfigModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-gray-600">
                Configure o ID e senha da sala para que os jogadores possam entrar no jogo.
              </p>
              
              <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <input
                  type="checkbox"
                  id="isOfficialRoom"
                  checked={currentMatch.isOfficialRoom}
                  onChange={(e) => setCurrentMatch({...currentMatch, isOfficialRoom: e.target.checked})}
                  className="h-4 w-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <label htmlFor="isOfficialRoom" className="ml-2 text-sm text-purple-900 font-medium">
                  Sala oficial para matchmaking automático
                </label>
              </div>
              
              {currentMatch.isOfficialRoom && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Esta é uma sala oficial!</strong> Quando jogadores buscarem partidas no lobby, 
                    eles serão automaticamente direcionados para esta sala, se disponível para o modo de jogo selecionado.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sala</label>
                <select
                  value={currentMatch.gameType || 'squad'}
                  onChange={(e) => setCurrentMatch({
                    ...currentMatch, 
                    gameType: e.target.value as 'solo' | 'duo' | 'squad',
                    format: e.target.value === 'solo' ? 'Solo' : e.target.value === 'duo' ? 'Dupla (2x2)' : 'Squad (4x4)',
                    maxPlayers: e.target.value === 'solo' ? 8 : e.target.value === 'duo' ? 8 : 16,
                    roomCapacity: e.target.value === 'solo' ? 8 : e.target.value === 'duo' ? 8 : 16
                  })}
                  className="px-3 py-2 border border-gray-300 rounded-md w-full focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="solo">Solo</option>
                  <option value="duo">Dupla (2x2)</option>
                  <option value="squad">Squad (4x4)</option>
                </select>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID da Sala</label>
                  <button
                    onClick={() => setCurrentMatch({...currentMatch, roomId: generateRoomId()})}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Gerar ID aleatório
                  </button>
                </div>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Ex: RPX12345"
                    className="px-3 py-2 border border-gray-300 rounded-l-md w-full focus:ring-purple-500 focus:border-purple-500"
                    value={currentMatch.roomId}
                    onChange={(e) => setCurrentMatch({...currentMatch, roomId: e.target.value})}
                  />
                  {currentMatch.roomId && (
                    <button
                      onClick={() => handleCopyToClipboard(currentMatch.roomId, 'ID da sala')}
                      className="bg-gray-100 hover:bg-gray-200 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md"
                      title="Copiar ID"
                    >
                      <Copy size={16} />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Recomendamos usar o prefixo RPX seguido de números.
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha da Sala</label>
                  <button
                    onClick={() => setCurrentMatch({...currentMatch, roomPassword: generateRoomPassword()})}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    Gerar senha aleatória
                  </button>
                </div>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Ex: pass123"
                    className="px-3 py-2 border border-gray-300 rounded-l-md w-full focus:ring-purple-500 focus:border-purple-500"
                    value={currentMatch.roomPassword}
                    onChange={(e) => setCurrentMatch({...currentMatch, roomPassword: e.target.value})}
                  />
                  {currentMatch.roomPassword && (
                    <button
                      onClick={() => handleCopyToClipboard(currentMatch.roomPassword, 'Senha da sala')}
                      className="bg-gray-100 hover:bg-gray-200 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md"
                      title="Copiar senha"
                    >
                      <Copy size={16} />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Use uma senha fácil de compartilhar com os jogadores.
                </p>
              </div>
              
              {!currentMatch.roomId || !currentMatch.roomPassword ? (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertCircle size={18} className="text-yellow-600 mr-2 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Você precisa definir o ID e a senha da sala para salvar a configuração.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setRoomConfigModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRoomConfig}
                disabled={!currentMatch.roomId || !currentMatch.roomPassword}
                className={`px-4 py-2 rounded-md text-white flex items-center ${
                  (!currentMatch.roomId || !currentMatch.roomPassword) 
                    ? 'bg-purple-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                <Save size={16} className="mr-2" />
                Salvar Configuração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 