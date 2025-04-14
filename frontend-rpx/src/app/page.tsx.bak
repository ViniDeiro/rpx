'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, Shield, Zap, Lock } from 'react-feather';
import { formatCurrency } from '@/utils/formatters';
import { SponsorPromoBanner } from '@/components/ui/SponsorPromoBanner';
import Character2D from '../components/2d/Character2D';
import '../components/2d/Character2D.css';

export default function Home() {
  const [characterType, setCharacterType] = useState('default');
  const [characterColor, setCharacterColor] = useState('#3498db');
  const [animation, setAnimation] = useState('idle');
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Verificar se o usuário é administrador
    const checkAdmin = () => {
      try {
        const adminStatus = localStorage.getItem('rpx-admin-auth');
        setIsAdmin(adminStatus === 'authenticated');
      } catch (error) {
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, []);
  
  const handleChangeType = () => {
    const types = ['default', 'ninja', 'warrior', 'mage', 'archer'];
    const currentIndex = types.indexOf(characterType);
    const nextIndex = (currentIndex + 1) % types.length;
    setCharacterType(types[nextIndex]);
  };
  
  const handleChangeColor = () => {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f', '#1abc9c'];
    const currentIndex = colors.indexOf(characterColor);
    const nextIndex = (currentIndex + 1) % colors.length;
    setCharacterColor(colors[nextIndex]);
  };
  
  const handleChangeAnimation = () => {
    const animations = ['idle', 'walk', 'run', 'attack', 'jump', 'dance'];
    const currentIndex = animations.indexOf(animation);
    const nextIndex = (currentIndex + 1) % animations.length;
    setAnimation(animations[nextIndex]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Barra de Admin - Visível apenas para administradores */}
      {isAdmin && (
        <div className="bg-purple-700 text-white py-2 px-4">
          <div className="container mx-auto flex justify-between items-center">
            <span className="font-semibold text-sm flex items-center">
              <Lock size={16} className="mr-1" /> Modo Administrador Ativo
            </span>
            <Link 
              href="/admin" 
              className="text-white text-sm bg-purple-900 hover:bg-purple-800 px-3 py-1 rounded transition-colors"
            >
              Acessar Painel Admin
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section - Ultra simplificada */}
      <div className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-8">
            <div className="text-white mb-2">Domine as apostas</div>
            <div className="text-white">em Free Fire</div>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            A primeira plataforma brasileira de apostas competitivas para Free Fire
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link 
              href="/lobby" 
              className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Apostar agora
            </Link>
            <Link 
              href="/sobre" 
              className="border border-gray-600 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Saiba mais
            </Link>
          </div>
        </div>
      </div>
      
      {/* Banner de patrocínio */}
      <div className="container mx-auto px-4 my-16">
        <SponsorPromoBanner className="mx-auto" />
      </div>

      {/* Por que escolher a RPX - Sem gradientes */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Por que escolher a <span className="text-purple-500">RPX</span>?
          </h2>
          <p className="text-center text-gray-300 mb-16 max-w-2xl mx-auto">
            Nossa plataforma foi desenvolvida por entusiastas de Free Fire para oferecer a melhor experiência de apostas
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card-bg border border-gray-700 p-8 rounded-xl text-center">
              <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-purple-400 text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Torneios Exclusivos</h3>
              <p className="text-gray-300">
                Participe de torneios exclusivos com premiações especiais disponíveis apenas na RPX
              </p>
            </div>

            <div className="bg-card-bg border border-gray-700 p-8 rounded-xl text-center">
              <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-purple-400 text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Melhores Odds</h3>
              <p className="text-gray-300">
                Oferecemos as melhores odds do mercado para maximizar seus ganhos em todas as apostas
              </p>
            </div>

            <div className="bg-card-bg border border-gray-700 p-8 rounded-xl text-center">
              <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-purple-400 text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Comunidade Ativa</h3>
              <p className="text-gray-300">
                Faça parte de uma comunidade apaixonada por Free Fire e compartilhe suas estratégias
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partidas em Destaque - Sem gradientes */}
      <section className="py-20 bg-card-bg/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Partidas em <span className="text-purple-500">Destaque</span></h2>
            <Link href="/partidas" className="text-purple-500 hover:text-purple-400">
              Ver todas →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Exemplo de Partida */}
            <div className="bg-card-bg p-6 rounded-xl border border-gray-700 hover:border-purple-600/30">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-400">Squad • Ranked</span>
                <span className="text-sm px-2 py-1 rounded bg-green-900/20 text-green-400">
                  Em breve
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-purple-400">👥</span>
                  <span>4 jogadores por equipe</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-purple-400">💰</span>
                  <span>Entrada: {formatCurrency(10)}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-purple-400">⏰</span>
                  <span>Início em 5 minutos</span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-background rounded">
                  <p className="text-sm text-gray-400 mb-1">Prêmio</p>
                  <p className="font-semibold text-purple-400">{formatCurrency(100)}</p>
                </div>
                <div className="text-center p-3 bg-background rounded">
                  <p className="text-sm text-gray-400 mb-1">Jogadores</p>
                  <p className="font-semibold text-purple-400">12/20</p>
                </div>
              </div>
              
              <button className="w-full mt-6 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded">
                Participar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Sem gradientes */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para <span className="text-purple-500">começar</span>?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Registre-se hoje e receba um bônus de R$50 para suas primeiras apostas
          </p>
          
          <Link 
            href="/auth/register" 
            className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2 rounded-lg font-semibold inline-block"
          >
            Criar conta
          </Link>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-12 text-sm text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <span className="text-purple-400">✅</span>
              <span>Retiradas no mesmo dia</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-purple-400">✅</span>
              <span>Suporte 24/7</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-purple-400">✅</span>
              <span>Interface amigável</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-purple-400">✅</span>
              <span>Apostas ao vivo</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-purple-400">✅</span>
              <span>Bônus exclusivos</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-purple-400">✅</span>
              <span>Segurança garantida</span>
            </div>
          </div>
        </div>
      </section>

      {/* Character Demo */}
      <section className="py-12 bg-muted/50">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Personagens RPX</h2>

          <div className="max-w-md mx-auto bg-background p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-center mb-4 text-gray-800">
              Personagem 2D - {characterType.charAt(0).toUpperCase() + characterType.slice(1)}
            </h3>
            
            <div className="h-48 w-full flex justify-center items-center mb-4">
              <Character2D 
                type={characterType} 
                color={characterColor} 
                animation={animation}
                size="large"
              />
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <button 
                onClick={handleChangeType}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Mudar Tipo
              </button>
              <button 
                onClick={handleChangeColor}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Mudar Cor
              </button>
              <button 
                onClick={handleChangeAnimation}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Animação: {animation}
              </button>
            </div>

            <div className="text-center">
              <Link 
                href="/character-demo" 
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                Ver mais personagens
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer com link Admin */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-white text-lg font-bold mb-2">RPX</h3>
              <p className="text-sm">© {new Date().getFullYear()} RPX. Todos os direitos reservados.</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
                Termos de Uso
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
                Privacidade
              </Link>
              <span 
                className="text-gray-400 hover:text-white text-sm cursor-pointer"
                onClick={() => {
                  if (isAdmin) {
                    localStorage.removeItem('rpx-admin-auth');
                    setIsAdmin(false);
                    window.location.reload();
                  } else {
                    window.location.href = '/admin/login';
                  }
                }}
              >
                {isAdmin ? 'Sair do Modo Admin' : 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
