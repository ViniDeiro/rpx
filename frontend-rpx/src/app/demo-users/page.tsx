'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Shield } from 'react-feather';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { RankTier } from '@/utils/ranking';

// Definição de um usuário com rank para exibição
interface RankUser {
  name: string;
  username: string;
  rank: {
    tier: RankTier;
    points: number;
  };
}

export default function DemoUsersPage() {
  const [users, setUsers] = useState<RankUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Carregar os dados dos usuários
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        // Não precisamos fazer uma chamada aqui, pois vamos carregar quando o usuário clicar no botão de criar
        setUsers([
          { name: "Luiz", username: "luiz", rank: { tier: "unranked", points: 0 } },
          { name: "João", username: "joao", rank: { tier: "bronze", points: 150 } },
          { name: "Julia", username: "julia", rank: { tier: "silver", points: 350 } },
          { name: "Bianca", username: "bianca", rank: { tier: "gold", points: 750 } },
          { name: "Yuri", username: "yuri", rank: { tier: "platinum", points: 950 } },
          { name: "Dacruz", username: "dacruz", rank: { tier: "diamond", points: 1350 } },
          { name: "Vini", username: "vini", rank: { tier: "legend", points: 1600 } },
          { name: "YgorX", username: "ygorx", rank: { tier: "challenger", points: 2100 } }
        ]);
      } catch (err) {
        setError("Erro ao carregar usuários");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Função para criar os usuários de rank
  const handleCreateUsers = async () => {
    setIsCreating(true);
    setError(null);
    setCreateSuccess(false);

    try {
      const response = await fetch('/api/auth/setup-rank-users');
      
      if (!response.ok) {
        throw new Error('Falha ao criar usuários');
      }
      
      const data = await response.json();
      console.log('Usuários criados:', data);
      setCreateSuccess(true);
    } catch (err) {
      console.error('Erro:', err);
      setError('Falha ao criar usuários. Verifique o console para mais detalhes.');
    } finally {
      setIsCreating(false);
    }
  };

  // Renderiza a página
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-purple-400 hover:text-purple-300 mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Voltar para Página Inicial
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">Usuários de Demonstração</h1>
        <p className="text-gray-400 mb-8">
          Cada usuário representa um rank diferente no sistema. Use esta página para criar e acessar estes usuários.
        </p>
      </div>

      {/* Botão para criar usuários */}
      <div className="mb-8">
        <button
          onClick={handleCreateUsers}
          disabled={isCreating}
          className={`px-4 py-2 rounded-lg flex items-center ${
            isCreating 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Criando usuários...
            </>
          ) : (
            <>
              <Shield size={18} className="mr-2" />
              Criar/Atualizar Usuários
            </>
          )}
        </button>

        {createSuccess && (
          <div className="mt-3 p-3 bg-green-500/20 border border-green-500 rounded-lg">
            Usuários criados/atualizados com sucesso!
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-500/20 border border-red-500 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Lista de usuários */}
      {isLoading ? (
        <div className="flex justify-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Informações de Acesso</h2>
            <p className="text-gray-400">
              Todos os usuários têm a senha: <span className="font-mono bg-gray-800 px-2 py-1 rounded">senha123</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {users.map((user) => (
              <div
                key={user.username}
                className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all"
              >
                <div className="flex flex-col items-center mb-4">
                  <div className="mb-3">
                    <ProfileAvatar size="md" rankTier={user.rank.tier} />
                  </div>
                  <h3 className="text-xl font-semibold">{user.name}</h3>
                  <div className="inline-block px-3 py-1 rounded-full bg-gray-700 text-sm mt-1">
                    {user.rank.tier.charAt(0).toUpperCase() + user.rank.tier.slice(1)}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Username:</span>
                    <span className="font-mono bg-gray-700 px-2 py-0.5 rounded text-sm">
                      {user.username}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Pontos:</span>
                    <span>{user.rank.points}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-700">
                  <button 
                    className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg flex items-center justify-center"
                    onClick={() => {
                      // Salvar informações para simular login
                      localStorage.setItem('demo_login_username', user.username);
                      localStorage.setItem('demo_login_password', 'senha123');
                      // Redirecionar para a página de login
                      window.location.href = '/login';
                    }}
                  >
                    <User size={16} className="mr-2" />
                    Entrar como {user.name}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 