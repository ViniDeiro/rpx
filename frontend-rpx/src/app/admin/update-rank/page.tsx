'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RankTier } from '@/utils/ranking';

export default function UpdateRankPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [tier, setTier] = useState<RankTier>('unranked');
  const [division, setDivision] = useState<string | null>(null);
  const [points, setPoints] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lista de ranks disponíveis
  const rankTiers: RankTier[] = [
    'unranked', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend', 'challenger'
  ];

  // Lista de divisões disponíveis
  const divisions = ['1', '2', '3', null];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('/api/auth/update-user-rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          tier,
          division,
          points,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao atualizar rank');
      } else {
        setMessage(data.message || 'Rank atualizado com sucesso');
        // Limpar campos após sucesso
        setUsername('');
        setTier('unranked');
        setDivision(null);
        setPoints(undefined);
      }
    } catch (error: any) {
      setError('Erro ao se comunicar com o servidor: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Determinar se divisões devem ser exibidas
  const showDivisions = tier !== 'unranked' && tier !== 'legend' && tier !== 'challenger';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-card-bg p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Atualizar Rank de Usuário</h1>
        
        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {message}
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Nome de usuário
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 bg-input border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="tier" className="block text-sm font-medium mb-1">
              Rank
            </label>
            <select
              id="tier"
              value={tier}
              onChange={(e) => setTier(e.target.value as RankTier)}
              className="w-full p-2 bg-input border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              {rankTiers.map((rank) => (
                <option key={rank} value={rank}>
                  {rank.charAt(0).toUpperCase() + rank.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {showDivisions && (
            <div className="mb-4">
              <label htmlFor="division" className="block text-sm font-medium mb-1">
                Divisão
              </label>
              <select
                id="division"
                value={division === null ? 'null' : division}
                onChange={(e) => setDivision(e.target.value === 'null' ? null : e.target.value)}
                className="w-full p-2 bg-input border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="null">Nenhuma</option>
                <option value="1">I</option>
                <option value="2">II</option>
                <option value="3">III</option>
              </select>
            </div>
          )}
          
          <div className="mb-6">
            <label htmlFor="points" className="block text-sm font-medium mb-1">
              Pontos (opcional - usará padrão se não informado)
            </label>
            <input
              type="number"
              id="points"
              value={points === undefined ? '' : points}
              onChange={(e) => setPoints(e.target.value === '' ? undefined : Number(e.target.value))}
              className="w-full p-2 bg-input border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="0"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Atualizando...' : 'Atualizar Rank'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/admin')}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            Voltar para o painel admin
          </button>
        </div>
      </div>
    </div>
  );
} 