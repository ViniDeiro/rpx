'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Mail, User, Award, Zap, DollarSign } from 'react-feather';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { RankTier } from '@/utils/ranking';

interface DemoUser {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string;
  createdAt: string;
  balance: number;
  rank: {
    tier: RankTier;
    division: '1' | '2' | '3' | null;
    points: number;
  };
}

export default function DemoProfilePage() {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Carregar dados do usuário simulado do localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário simulado:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Obter nome do rank com divisão
  const getRankName = (tier: RankTier, division: '1' | '2' | '3' | null) => {
    const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
    if (division === null || tier === 'legend' || tier === 'challenger' || tier === 'unranked') {
      return tierName;
    }
    return `${tierName} ${division}`;
  };
  
  // Cor de destaque baseada no rank
  const getRankColor = (tier: RankTier) => {
    switch (tier) {
      case 'bronze': return 'text-amber-400';
      case 'silver': return 'text-gray-300';
      case 'gold': return 'text-yellow-400';
      case 'platinum': return 'text-teal-400';
      case 'diamond': return 'text-blue-400';
      case 'legend': return 'text-purple-400';
      case 'challenger': return 'text-fuchsia-400';
      default: return 'text-gray-400';
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-16 px-4">
        <div className="flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Link href="/demo-ranks/login" className="flex items-center text-purple-400 hover:text-purple-300 mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Voltar para Login
        </Link>
        
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Usuário não encontrado</h1>
          <p className="mb-4">Não foi possível carregar os dados do usuário simulado.</p>
          <Link 
            href="/demo-ranks/login" 
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg inline-block"
          >
            Voltar para a Página de Login
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <Link href="/demo-ranks" className="flex items-center text-purple-400 hover:text-purple-300">
          <ArrowLeft size={18} className="mr-2" />
          Voltar para Demonstração
        </Link>
        
        <Link 
          href="/demo-ranks/login" 
          className="text-purple-400 hover:text-purple-300"
        >
          Trocar Rank
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de perfil com avatar e detalhes do rank */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 flex flex-col items-center text-center">
          <div className="mb-4">
            <ProfileAvatar 
              size="lg" 
              rankTier={user.rank.tier}
            />
          </div>
          
          <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
          <p className="text-gray-400 mb-4">@{user.username}</p>
          
          <div className={`px-4 py-2 rounded-full ${getRankColor(user.rank.tier)} bg-black/20 font-medium mb-6`}>
            {getRankName(user.rank.tier, user.rank.division)}
          </div>
          
          <ul className="w-full space-y-3 mt-2">
            <li className="flex items-center text-gray-300">
              <Mail size={16} className="mr-2 text-gray-400" />
              <span className="text-sm">{user.email}</span>
            </li>
            <li className="flex items-center text-gray-300">
              <Calendar size={16} className="mr-2 text-gray-400" />
              <span className="text-sm">Membro desde {formatDate(user.createdAt)}</span>
            </li>
            <li className="flex items-center text-gray-300">
              <Zap size={16} className="mr-2 text-gray-400" />
              <span className="text-sm">{user.rank.points} pontos de rank</span>
            </li>
          </ul>
        </div>
        
        {/* Detalhes e estatísticas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Award className="mr-2 text-purple-400" size={20} />
              Detalhes do Rank
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Rank Atual</div>
                <div className={`text-xl font-bold ${getRankColor(user.rank.tier)}`}>
                  {getRankName(user.rank.tier, user.rank.division)}
                </div>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Pontos</div>
                <div className="text-xl font-bold">{user.rank.points}</div>
              </div>
              
              <div className="bg-gray-900/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Próximo Rank</div>
                <div className="text-xl font-bold">
                  {user.rank.tier === 'challenger' ? 'Rank Máximo' : 'Em breve'}
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-purple-900/20 border border-purple-800/30 rounded-lg">
              <p className="text-sm text-gray-300">
                <span className="text-purple-400 font-medium">Nota:</span> Este perfil é simulado para demonstração. 
                A moldura ao redor do avatar corresponde ao rank <span className={getRankColor(user.rank.tier)}>{getRankName(user.rank.tier, user.rank.division)}</span>.
              </p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <DollarSign className="mr-2 text-green-400" size={20} />
              Saldo da Conta
            </h2>
            
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-6 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Saldo disponível</div>
                <div className="text-3xl font-bold text-white">
                  R$ {user.balance.toFixed(2).replace('.', ',')}
                </div>
              </div>
              
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white">
                Adicionar Fundos
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link 
          href="/demo-ranks" 
          className="text-purple-400 hover:text-purple-300 font-medium"
        >
          Voltar para a Galeria de Ranks
        </Link>
      </div>
    </div>
  );
} 