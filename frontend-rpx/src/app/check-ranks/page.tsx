'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'react-feather';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { RankTier } from '@/utils/ranking';

// Tipo para usuário com rank
interface UserWithRank {
  name: string;
  username: string;
  rank: RankTier;
  points: number;
}

export default function CheckRanksPage() {
  const [users, setUsers] = useState<UserWithRank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar usuários ao carregar a página
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/check-users-ranks');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar usuários');
        }
        
        const data = await response.json();
        console.log('Dados brutos:', data);
        
        if (data.users) {
          setUsers(data.users);
        } else {
          setError('Formato de resposta inesperado');
        }
      } catch (err) {
        console.error('Erro:', err);
        setError('Falha ao carregar usuários. Veja o console para detalhes.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-purple-400 hover:text-purple-300 mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Voltar para Página Inicial
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">Verificação de Ranks dos Usuários</h1>
        <p className="text-gray-400 mb-8">
          Esta página mostra os usuários criados e seus respectivos ranks no sistema.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2 text-red-400">Erro</h2>
          <p>{error}</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900/80">
              <tr>
                <th className="px-4 py-3 text-left">Usuário</th>
                <th className="px-4 py-3 text-left">Nome de usuário</th>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-right">Pontos</th>
                <th className="px-4 py-3 text-center">Avatar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user.username} className="hover:bg-gray-700/30">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 font-mono text-sm">{user.username}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-gray-700 text-sm">
                      {user.rank.charAt(0).toUpperCase() + user.rank.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{user.points}</td>
                  <td className="px-4 py-3 flex justify-center">
                    <ProfileAvatar size="sm" rankTier={user.rank as RankTier} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 bg-purple-900/20 border border-purple-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-2">Solução de problemas</h2>
        <p className="mb-4">
          Se os usuários estão todos aparecendo como unranked, pode ser necessário recriar os usuários com os ranks corretos.
        </p>
        <Link 
          href="/demo-users" 
          className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
        >
          Ir para página de criação de usuários
        </Link>
      </div>
    </div>
  );
} 