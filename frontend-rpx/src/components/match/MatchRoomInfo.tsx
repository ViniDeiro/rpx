'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Copy, Lock, Users } from 'react-feather';
import MatchCountdownTimer from './MatchCountdownTimer';

interface MatchRoomInfoProps {
  matchId: string;
  matchStatus: string;
  roomInfo: {
    roomId: string | null;
    password: string | null;
    createdBy: string | null;
    createdAt: string | null;
  };
  isAdmin: boolean;
  onRoomConfigured?: () => void;
  onTimerEnd?: () => void;
}

const MatchRoomInfo: React.FC<MatchRoomInfoProps> = ({
  matchId,
  matchStatus,
  roomInfo,
  isAdmin,
  onRoomConfigured,
  onTimerEnd
}) => {
  const { data: session } = useSession();
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const hasRoomInfo = roomInfo.roomId && roomInfo.password;

  const handleConfigureRoom = async () => {
    if (!session?.user?.id) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (!roomId || !password) {
      toast.error('ID da sala e senha são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/matches/configure-room', {
        matchId,
        roomId,
        password
      });

      if (response.data.status === 'success') {
        toast.success('Sala configurada com sucesso!');
        if (onRoomConfigured) {
          onRoomConfigured();
        }
      } else {
        toast.error(response.data.error || 'Erro ao configurar sala');
      }
    } catch (error: any) {
      console.error('Erro ao configurar sala:', error);
      toast.error(error.response?.data?.error || 'Falha ao configurar sala');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const handleTimerEnd = () => {
    // Quando o timer acabar
    toast.error('O tempo para entrar na sala acabou!');
    if (onTimerEnd) {
      onTimerEnd();
    }
  };

  return (
    <div className="bg-card-bg border border-primary/20 rounded-lg p-6 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Informações da Sala</h2>

      {/* Status da partida */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className={`w-3 h-3 rounded-full ${
              matchStatus === 'preparing' ? 'bg-amber-500' :
              matchStatus === 'ready' ? 'bg-green-500' :
              matchStatus === 'in_progress' ? 'bg-blue-500' :
              matchStatus === 'completed' ? 'bg-purple-500' :
              'bg-gray-500'
            }`} 
          />
          <span className="font-medium">
            {matchStatus === 'preparing' && 'Preparando sala...'}
            {matchStatus === 'ready' && 'Sala pronta!'}
            {matchStatus === 'in_progress' && 'Partida em andamento'}
            {matchStatus === 'completed' && 'Partida finalizada'}
          </span>
        </div>
      </div>

      {/* Timer de contagem regressiva */}
      {hasRoomInfo && matchStatus === 'ready' && (
        <div className="mb-6">
          <MatchCountdownTimer 
            createdAt={roomInfo.createdAt} 
            duration={5} 
            onTimeEnd={handleTimerEnd} 
          />
          <p className="text-sm text-muted mt-2">
            Todos os jogadores devem entrar na sala do Free Fire dentro deste tempo.
          </p>
        </div>
      )}

      {/* Formulário de configuração para admins */}
      {isAdmin && matchStatus === 'preparing' && !hasRoomInfo && (
        <div className="bg-card-hover rounded p-4 mb-6">
          <h3 className="font-semibold text-lg mb-3">Configurar Sala (Admin)</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium mb-1">
                ID da Sala Free Fire
              </label>
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Digite o ID da sala"
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Senha da Sala
              </label>
              <input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha da sala"
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleConfigureRoom}
              disabled={loading || !roomId || !password}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded font-medium text-white ${
                loading ? 'bg-blue-700 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : null}
              {loading ? 'Configurando...' : 'Configurar Sala'}
            </button>
          </div>
        </div>
      )}

      {/* Exibição de informações da sala */}
      {hasRoomInfo && (
        <div className="bg-card-hover rounded p-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-muted" />
                <span className="text-sm font-medium">ID da Sala:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-input px-2 py-1 rounded">{roomInfo.roomId}</span>
                <button 
                  onClick={() => copyToClipboard(roomInfo.roomId || '')}
                  className="p-1 rounded hover:bg-background"
                >
                  <Copy size={16} className="text-muted hover:text-primary" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-muted" />
                <span className="text-sm font-medium">Senha:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-input px-2 py-1 rounded">{roomInfo.password}</span>
                <button 
                  onClick={() => copyToClipboard(roomInfo.password || '')}
                  className="p-1 rounded hover:bg-background"
                >
                  <Copy size={16} className="text-muted hover:text-primary" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-950/30 border border-amber-500/30 rounded-md">
            <p className="text-sm text-amber-200">
              Entre na sala com o ID e senha acima. Todos os jogadores devem estar prontos antes do início da partida.
            </p>
          </div>
        </div>
      )}

      {/* Mensagem para partidas não configuradas */}
      {!hasRoomInfo && matchStatus === 'preparing' && !isAdmin && (
        <div className="bg-blue-950/30 border border-blue-500/30 rounded-md p-4">
          <p className="text-sm text-blue-200">
            Aguarde enquanto o administrador configura a sala da partida. Você receberá uma notificação quando estiver pronta.
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchRoomInfo; 