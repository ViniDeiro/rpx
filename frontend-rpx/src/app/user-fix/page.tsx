'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserFixPage() {
  const { refreshUser } = useAuth();
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fixYuriRank = async () => {
    try {
      setIsLoading(true);
      setMessage('Atualizando o rank do usuário yuri...');
      
      const response = await fetch('/api/auth/fix-yuri-rank');
      const data = await response.json();
      
      setMessage(`Resposta: ${data.message}. Agora atualizando dados do usuário...`);
      
      // Refresh user data
      await refreshUser();
      
      setMessage(`${data.message}. Dados do usuário atualizados com sucesso!`);
    } catch (error) {
      console.error('Erro:', error);
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRank = async (username: string, tier: string) => {
    try {
      setIsLoading(true);
      setMessage(`Atualizando rank do usuário ${username} para ${tier}...`);
      
      const response = await fetch('/api/auth/update-user-rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          tier,
          division: '2',
        }),
      });
      
      const data = await response.json();
      
      setMessage(`Resposta: ${data.message || data.error}. ${data.success ? 'Agora atualizando dados do usuário...' : ''}`);
      
      if (data.success) {
        // Refresh user data
        await refreshUser();
        setMessage(`${data.message}. Dados do usuário atualizados com sucesso!`);
      }
    } catch (error) {
      console.error('Erro:', error);
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const ranks = ['unranked', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend', 'challenger'];

  return (
    <div className="min-h-screen bg-[#0D0A2A] text-white p-8">
      <div className="max-w-md mx-auto bg-[#171335] rounded-xl p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Corretor de Ranks</h1>
        
        {message && (
          <div className="mb-6 p-4 bg-[#232048] rounded-lg">
            <p>{message}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <button
            onClick={fixYuriRank}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processando...' : 'Corrigir Rank do Yuri (Gold)'}
          </button>
          
          <div className="border-t border-[#3D2A85] my-6 pt-6">
            <h2 className="text-xl font-semibold mb-4">Definir Rank do Yuri</h2>
            
            <div className="grid grid-cols-2 gap-2">
              {ranks.map(rank => (
                <button
                  key={rank}
                  onClick={() => updateUserRank('yuri', rank)}
                  disabled={isLoading}
                  className="bg-[#232048] hover:bg-[#3D2A85] text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {rank.charAt(0).toUpperCase() + rank.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 