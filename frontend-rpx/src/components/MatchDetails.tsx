'use client';

import React from 'react';
import { Clock, Users, DollarSign, Tag, Lock, Copy, AlertCircle } from 'react-feather';

// Interface para as props do componente
interface MatchDetailsProps {
  match: {
    id: string | number;
    name: string;
    format: string;
    entry: number;
    prize: number;
    status: string;
    startTime: string;
    players: number;
    maxPlayers: number;
    roomId?: string;
    roomPassword?: string;
    configuredRoom?: boolean;
  };
}

// Função para obter cor e texto do status
const getStatusInfo = (status: string) => {
  switch (status) {
    case 'em_espera':
      return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Aguardando jogadores' };
    case 'em_breve':
      return { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Em breve' };
    case 'em_andamento':
      return { color: 'bg-green-100 text-green-800 border-green-200', text: 'Em andamento' };
    case 'finalizada':
      return { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Finalizada' };
    case 'cancelada':
      return { color: 'bg-red-100 text-red-800 border-red-200', text: 'Cancelada' };
    default:
      return { color: 'bg-gray-100 text-gray-800 border-gray-200', text: status };
  }
};

// Função para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatar data
const formatTime = (date: string) => {
  const dateObj = new Date(date);
  return dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Componente principal
export default function MatchDetails({ match }: MatchDetailsProps) {
  const statusInfo = getStatusInfo(match.status);
  
  // Função para copiar texto para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copiado para a área de transferência: ${text}`);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Cabeçalho com nome e status */}
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {match.name || `Partida #${match.id}`}
        </h2>
        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      </div>
      
      {/* Corpo com detalhes da partida */}
      <div className="border-b border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <Clock size={16} className="mr-2" />
              Horário
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatTime(match.startTime)}
            </dd>
          </div>
          
          <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <Users size={16} className="mr-2" />
              Formato
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {match.format} • {match.players}/{match.maxPlayers} jogadores
            </dd>
          </div>
          
          <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <DollarSign size={16} className="mr-2" />
              Entrada
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatCurrency(match.entry)}
            </dd>
          </div>
          
          <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <DollarSign size={16} className="mr-2" />
              Prêmio
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
              {formatCurrency(match.prize)}
            </dd>
          </div>
        </dl>
      </div>
      
      {/* Informações da sala */}
      {match.configuredRoom && match.roomId && match.roomPassword ? (
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base font-medium text-gray-900 mb-3">Informações da Sala</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <Tag size={16} className="mr-2 text-purple-600" />
                  ID da Sala
                </span>
                <button 
                  onClick={() => copyToClipboard(match.roomId || '')}
                  className="text-purple-600 hover:text-purple-800"
                  title="Copiar ID"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="mt-2 text-base font-bold text-purple-900">{match.roomId}</p>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <Lock size={16} className="mr-2 text-purple-600" />
                  Senha da Sala
                </span>
                <button 
                  onClick={() => copyToClipboard(match.roomPassword || '')}
                  className="text-purple-600 hover:text-purple-800"
                  title="Copiar senha"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="mt-2 text-base font-bold text-purple-900">{match.roomPassword}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-5 sm:px-6">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start">
            <AlertCircle size={20} className="mr-3 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Sala não configurada</h3>
              <div className="mt-1 text-sm text-yellow-700">
                As informações da sala serão exibidas aqui assim que forem configuradas pelo administrador.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 