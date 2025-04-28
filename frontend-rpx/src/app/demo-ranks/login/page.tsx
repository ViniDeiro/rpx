'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'react-feather';
import { RankTier } from '@/utils/ranking';
import { useAuth } from '@/contexts/AuthContext';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

// Função para obter a cor de fundo de acordo com o rank
function getRankBgColor(rank: RankTier): string {
  switch (rank) {
    case 'unranked': return 'bg-gray-700/50';
    case 'bronze': return 'bg-amber-900/50';
    case 'silver': return 'bg-gray-500/50';
    case 'gold': return 'bg-yellow-700/50';
    case 'platinum': return 'bg-teal-700/50';
    case 'diamond': return 'bg-blue-800/50';
    case 'legend': return 'bg-purple-800/50';
    case 'challenger': return 'bg-fuchsia-800/50';
    default: return 'bg-gray-700/50';
  }
}

// Interface para os perfis de demonstração
interface DemoProfile {
  name: string;
  tier: RankTier;
  points: number;
  avatarUrl: string;
}

export default function DemoRankLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Perfis pré-definidos para cada rank
  const demoProfiles: DemoProfile[] = [
    {
      name: 'Jogador Iniciante',
      tier: 'unranked',
      points: 0,
      avatarUrl: '/images/avatars/default.svg'
    },
    {
      name: 'BronzeWarrior',
      tier: 'bronze',
      points: 150,
      avatarUrl: '/images/avatars/blue.svg'
    },
    {
      name: 'SilverStriker',
      tier: 'silver',
      points: 350,
      avatarUrl: '/images/avatars/purple.svg'
    },
    {
      name: 'GoldMaster',
      tier: 'gold',
      points: 750,
      avatarUrl: '/images/avatars/green.svg'
    },
    {
      name: 'PlatinumElite',
      tier: 'platinum',
      points: 950,
      avatarUrl: '/images/avatars/default.svg'
    },
    {
      name: 'DiamondDominator',
      tier: 'diamond',
      points: 1350,
      avatarUrl: '/images/avatars/blue.svg'
    },
    {
      name: 'LegendaryPlayer',
      tier: 'legend',
      points: 1600,
      avatarUrl: '/images/avatars/purple.svg'
    },
    {
      name: 'UltimateChallenger',
      tier: 'challenger',
      points: 2100,
      avatarUrl: '/images/avatars/green.svg'
    }
  ];
  
  // Função para fazer login com o perfil selecionado
  const handleDemoLogin = async (selectedRank: RankTier) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar nossa API de demo
      const response = await fetch(`/api/auth/demo-user?rank=${selectedRank}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuário simulado');
      }
      
      const data = await response.json();
      
      // Salvar o token e dados do usuário simulado
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
      
      // Forçar um pequeno atraso para simular o processo de login
      setTimeout(() => {
        // Redirecionar para a página de demonstração
        router.push('/demo-ranks');
      }, 1000);
    } catch (error) {
      console.error('Erro ao fazer login simulado:', error);
      setError('Não foi possível carregar o usuário simulado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <Link href="/" className="flex items-center text-purple-400 hover:text-purple-300 mb-6">
        <ArrowLeft size={18} className="mr-2" />
        Voltar para Página Inicial
      </Link>
      
      <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
        <h1 className="text-3xl font-bold mb-2">Escolha um Perfil</h1>
        <p className="text-gray-400 mb-8">
          Selecione um perfil abaixo para visualizar como ficam as molduras de perfil com diferentes ranks.
        </p>
        
        {error && (
          <div className="p-4 mb-6 bg-red-900/30 border border-red-800 rounded-lg text-red-300">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {demoProfiles.map((profile) => (
            <div 
              key={profile.tier}
              className={`
                p-6 rounded-lg border-2 cursor-pointer transition-all
                ${getRankBgColor(profile.tier)}
                border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20
              `}
              onClick={() => !isLoading && handleDemoLogin(profile.tier)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">
                  <ProfileAvatar 
                    size="md" 
                    rankTier={profile.tier}
                  />
                </div>
                
                <h3 className="text-lg font-semibold mb-1">{profile.name}</h3>
                
                <div className="mb-2">
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${profile.tier === 'unranked' ? 'bg-gray-700 text-gray-300' : ''}
                    ${profile.tier === 'bronze' ? 'bg-amber-900/50 text-amber-300' : ''}
                    ${profile.tier === 'silver' ? 'bg-gray-700/50 text-gray-300' : ''}
                    ${profile.tier === 'gold' ? 'bg-yellow-800/50 text-yellow-300' : ''}
                    ${profile.tier === 'platinum' ? 'bg-teal-900/50 text-teal-300' : ''}
                    ${profile.tier === 'diamond' ? 'bg-blue-900/50 text-blue-300' : ''}
                    ${profile.tier === 'legend' ? 'bg-purple-900/50 text-purple-300' : ''}
                    ${profile.tier === 'challenger' ? 'bg-fuchsia-900/50 text-fuchsia-300' : ''}
                  `}>
                    {profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
                  </span>
                </div>
                
                <p className="text-gray-400 text-sm">
                  {profile.points} pontos
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg text-sm">
          <p className="text-blue-300 font-medium">Nota:</p>
          <p className="text-gray-300">
            Este login é apenas para demonstração. Os dados são simulados e não são salvos no banco de dados.
            A moldura do perfil será aplicada automaticamente de acordo com o rank escolhido.
          </p>
        </div>
      </div>
    </div>
  );
} 