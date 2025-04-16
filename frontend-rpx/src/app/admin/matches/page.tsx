'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { 
  Clock, Users, AlertCircle, Check, 
  RefreshCw, Search, Filter
} from 'react-feather';

interface Match {
  _id: string;
  players: string[];
  playersInfo: Array<{
    _id: string;
    username: string;
    avatarUrl?: string;
  }>;
  lobbyId: string;
  betAmount: number;
  gameMode: string;
  status: string;
  createdAt: string;
}

export default function AdminMatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('waiting');

  // Buscar partidas pendentes 
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/matches?status=${statusFilter}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setMatches(data.matches || []);
      } else {
        toast.error(data.error || 'Erro ao carregar partidas');
        setError(data.error || 'Erro ao carregar partidas');
      }
    } catch (error) {
      console.error('Erro ao buscar partidas:', error);
      toast.error('Erro ao carregar partidas');
      setError('Erro ao carregar partidas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar partidas ao iniciar
  useEffect(() => {
    fetchMatches();
    
    // Configurar refresh automático a cada 30 segundos
    const interval = setInterval(fetchMatches, 30000);
    
    return () => clearInterval(interval);
  }, [statusFilter]);

  // Selecionar partida para configurar
  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setRoomId('');
    setRoomPassword('');
  };

  // Configurar sala da partida
  const handleSubmitRoom = async () => {
    if (!selectedMatch) return;
    if (!roomId.trim() || !roomPassword.trim()) {
      toast.error('Por favor, preencha o ID e a senha da sala');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/admin/matches', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          matchId: selectedMatch._id,
          roomId: roomId.trim(),
          roomPassword: roomPassword.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Sala configurada com sucesso!');
        // Remover a partida da lista e limpar seleção
        setMatches(matches.filter(m => m._id !== selectedMatch._id));
        setSelectedMatch(null);
      } else {
        toast.error(data.error || 'Erro ao configurar sala');
      }
    } catch (error) {
      console.error('Erro ao configurar sala:', error);
      toast.error('Erro ao configurar sala');
    } finally {
      setSubmitting(false);
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };
  
  // Filtrar partidas por busca
  const filteredMatches = searchQuery
    ? matches.filter((match) => 
        match._id.includes(searchQuery) || 
        match.playersInfo.some(player => 
          player.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : matches;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Gerenciamento de Partidas</h1>
          <p className="text-gray-400">Configure as salas para as partidas dos jogadores</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-card-hover border border-primary/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="waiting">Aguardando Sala</option>
            <option value="ready">Salas Prontas</option>
            <option value="ongoing">Em Andamento</option>
            <option value="finished">Finalizadas</option>
          </select>
          
          <button
            onClick={fetchMatches}
            className="bg-card-hover hover:bg-card-hover/80 border border-primary/20 rounded-lg p-2 text-gray-300"
            title="Atualizar lista"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>
      
      {/* Barra de busca */}
      <div className="mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID ou jogador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card-hover border border-primary/20 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de partidas */}
        <div className="lg:col-span-2">
          <div className="bg-card-bg border border-primary/10 rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Partidas Pendentes</h2>
              <span className="text-sm text-gray-400">
                {filteredMatches.length} partida(s) encontrada(s)
              </span>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="mx-auto mb-2 h-10 w-10 text-red-400" />
                <p>{error}</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                <p>Nenhuma partida pendente</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Tente ajustar seus filtros de busca</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMatches.map(match => (
                  <div
                    key={match._id}
                    className={`border p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedMatch?._id === match._id ? 'border-primary bg-card-hover' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleSelectMatch(match)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium">Partida #{match._id.substring(0, 6)}</h3>
                        <div className="flex items-center text-sm text-gray-400">
                          <Clock size={14} className="mr-1" />
                          {formatDate(match.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 mr-2">
                          {match.gameMode === 'squad' ? 'Squad' :
                           match.gameMode === 'duo' ? 'Duo' : 'Solo'}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                          R$ {match.betAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {match.playersInfo.map(player => (
                        <div key={player._id} className="flex items-center bg-card-hover px-2 py-1 rounded-full">
                          <div className="w-5 h-5 rounded-full overflow-hidden mr-1">
                            <Image
                              src={player.avatarUrl || '/images/avatars/default.jpg'}
                              alt={player.username}
                              width={20}
                              height={20}
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs">{player.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Painel lateral */}
        <div>
          <div className="bg-card-bg border border-primary/10 rounded-lg shadow-md p-4">
            <h2 className="text-lg font-medium mb-4">Configurar Sala</h2>
            
            {!selectedMatch ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="mx-auto mb-2 h-10 w-10 text-gray-400" />
                <p>Selecione uma partida para configurar</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Partida Selecionada</h3>
                  <p className="text-sm text-gray-400">#{selectedMatch._id.substring(0, 8)}</p>
                  <div className="mt-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/20 text-primary mr-2">
                      {selectedMatch.gameMode === 'squad' ? 'Squad' :
                       selectedMatch.gameMode === 'duo' ? 'Duo' : 'Solo'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                      <Users size={14} /> {selectedMatch.playersInfo.length} jogadores
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      ID da Sala
                    </label>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Digite o ID da sala"
                      className="w-full bg-card-hover border border-primary/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-1">
                      Senha da Sala
                    </label>
                    <input
                      type="text"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                      placeholder="Digite a senha da sala"
                      className="w-full bg-card-hover border border-primary/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  
                  <button 
                    className={`w-full py-2 px-4 rounded-lg flex items-center justify-center ${
                      submitting || !roomId.trim() || !roomPassword.trim()
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-dark'
                    } transition-colors text-white font-medium`}
                    disabled={submitting || !roomId.trim() || !roomPassword.trim()}
                    onClick={handleSubmitRoom}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <Check size={16} className="mr-2" />
                        Confirmar Sala
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 