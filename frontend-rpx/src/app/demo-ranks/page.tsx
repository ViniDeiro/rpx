'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'react-feather';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { RankTier } from '@/utils/ranking';

// Definição de um usuário simulado para demonstração
interface DemoUser {
  name: string;
  tier: RankTier;
  points: number;
  avatarUrl: string;
}

export default function DemoRanksPage() {
  // Lista de todos os ranks disponíveis
  const allRanks: RankTier[] = [
    'unranked',
    'bronze',
    'silver',
    'gold',
    'platinum',
    'diamond',
    'legend',
    'challenger'
  ];
  
  // Usuários simulados para cada rank
  const demoUsers: DemoUser[] = [
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

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-6">
        <Link href="/" className="flex items-center text-purple-400 hover:text-purple-300 mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Voltar para Página Inicial
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">Demonstração de Ranks</h1>
        <p className="text-gray-400 mb-8">
          Esta página mostra como as molduras aparecem para cada rank no sistema.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {demoUsers.map((user) => (
          <div 
            key={user.tier} 
            className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-purple-500/50 transition-all"
          >
            <div className="flex flex-col items-center text-center">
              {/* Usando uma função anônima para simular o useAuth hook e retornar o usuário simulado */}
              <div className="mb-4 relative">
                <ProfileAvatar 
                  size="lg" 
                  rankTier={user.tier}
                />
              </div>
              
              <h3 className="text-xl font-semibold mb-1">{user.name}</h3>
              
              <div className="mb-3">
                <span className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${user.tier === 'unranked' ? 'bg-gray-700 text-gray-300' : ''}
                  ${user.tier === 'bronze' ? 'bg-amber-900/50 text-amber-300' : ''}
                  ${user.tier === 'silver' ? 'bg-gray-700/50 text-gray-300' : ''}
                  ${user.tier === 'gold' ? 'bg-yellow-800/50 text-yellow-300' : ''}
                  ${user.tier === 'platinum' ? 'bg-teal-900/50 text-teal-300' : ''}
                  ${user.tier === 'diamond' ? 'bg-blue-900/50 text-blue-300' : ''}
                  ${user.tier === 'legend' ? 'bg-purple-900/50 text-purple-300' : ''}
                  ${user.tier === 'challenger' ? 'bg-fuchsia-900/50 text-fuchsia-300' : ''}
                `}>
                  {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                </span>
              </div>
              
              <p className="text-gray-400">
                {user.points} pontos
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-purple-900/20 border border-purple-800/30 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Informações sobre as Molduras</h2>
        <p className="mb-4">
          As molduras são aplicadas automaticamente com base no rank do jogador. Elas são armazenadas na pasta <code>/images/frames/</code> e são carregadas dinamicamente pelo componente ProfileAvatar.
        </p>
        <p>
          Para usar molduras personalizadas em seus próprios componentes, você pode passar a prop <code>frameUrl</code> para o componente ProfileAvatar.
        </p>
      </div>
    </div>
  );
} 