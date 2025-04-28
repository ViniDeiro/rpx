'use client';

// Adicionando comentário para testar edições

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Flag, Lock, Star, Users, DollarSign, Target, Award, User, Shield } from 'react-feather';
import { formatCurrency } from '@/utils/formatters';
import { SponsorPromoBanner } from '@/components/ui/SponsorPromoBanner';

// Definir a interface para as partículas
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
}

export default function Home() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [characterType, setCharacterType] = React.useState('default');
  const [characterColor, setCharacterColor] = React.useState('#3498db');
  const [animation, setAnimation] = React.useState('idle');
  const [testimonialIndex, setTestimonialIndex] = React.useState(0);
  const [countdown, setCountdown] = useState({ hours: 12, minutes: 30, seconds: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Partículas dinâmicas para o hero - com tipagem correta
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    // Gerar partículas aleatórias
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 5 + 1,
          speed: Math.random() * 20 + 10,
          color: i % 3 === 0 ? 'purple-500' : i % 3 === 1 ? 'blue-500' : 'indigo-400'
        });
      }
      setParticles(newParticles);
    };
    
    generateParticles();
    
    // Simular countdown para próximo torneio
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 }; // Reset
      });
    }, 1000);
    
    // Efeito de carregamento
    setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearInterval(timer);
  }, []);
  
  const testimonials = [
    {
      name: "Ricardo Oliveira",
      avatar: "/images/avatars/avatar1.png",
      role: "Jogador Profissional",
      text: "A RPX revolucionou a forma como aposto em Free Fire. Interface intuitiva e odds imbatíveis!"
    },
    {
      name: "Amanda Santos",
      avatar: "/images/avatars/avatar2.png",
      role: "Streamer",
      text: "Uso a RPX há 6 meses e já consegui ganhos consideráveis. A plataforma mais confiável do mercado!"
    },
    {
      name: "Carlos Eduardo",
      avatar: "/images/avatars/avatar3.png",
      role: "Competidor Amador",
      text: "Os torneios exclusivos da RPX são incríveis. Ganhei meu primeiro campeonato aqui!"
    }
  ];
  
  React.useEffect(() => {
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
    
    // Carrossel automático para os depoimentos
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);
  
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
    <div className={`min-h-screen bg-background text-foreground ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
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

      {/* Hero Section - Completamente redesenhada */}
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black">
        {/* Vídeo de fundo com overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/60 via-indigo-950/80 to-black/90 z-10"></div>
          <div className="absolute inset-0 bg-[url('/images/game-bg.jpg')] bg-cover bg-center opacity-50"></div>
          
          {/* Efeito de brilho adicional */}
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-blue-900/10 to-transparent z-5 opacity-70"></div>
          
          {/* Partículas animadas */}
          {particles.map(particle => (
            <div 
              key={particle.id}
              className={`absolute w-${particle.size} h-${particle.size} rounded-full bg-${particle.color} blur-sm`}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animation: `float ${particle.speed}s infinite alternate ease-in-out`
              }}
            ></div>
          ))}
        </div>
        
        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="text-center lg:text-left" data-aos="fade-right">
              <div className="inline-block px-4 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-semibold mb-6 animate-pulse">
                🔥 Primeira plataforma brasileira de apostas para Free Fire 🔥
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                <span className="block text-white mb-2 drop-shadow-lg">Domine as apostas</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">em Free Fire</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-xl">
                Aposte, jogue e ganhe em uma plataforma desenvolvida 
                <span className="text-purple-400 font-semibold"> exclusivamente para gamers</span>.
              </p>
              
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link 
                    href="/lobby" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg shadow-purple-700/30 flex items-center justify-center"
                  >
                    Começar agora <ArrowRight className="ml-2" size={20} />
                  </Link>
                  <Link 
                    href="/sobre" 
                    className="border border-gray-600 hover:border-purple-400 hover:bg-purple-900/20 text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center justify-center"
                  >
                    Saiba mais
                  </Link>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start text-sm text-gray-400 gap-6">
                  <div className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2" />
                    <span>100% Seguro</span>
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2" />
                    <span>Pagamento Instantâneo</span>
                  </div>
                  <div className="flex items-center">
                    <Check size={16} className="text-green-500 mr-2" />
                    <span>Suporte 24/7</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative" data-aos="fade-left">
              {/* Celular flutuante com app */}
              <div className="relative mx-auto w-full max-w-xs">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[3rem] blur-xl opacity-30 animate-pulse"></div>
                <div className="relative bg-gray-900 border-4 border-gray-800 rounded-[3rem] overflow-hidden shadow-2xl p-1 transform rotate-6 hover:rotate-0 transition-transform duration-700 w-full">
                  <div className="h-6 w-20 bg-black rounded-full mx-auto mb-2"></div>
                  <div className="rounded-[2.5rem] overflow-hidden bg-black w-full">
                    <div className="relative h-[480px] w-full min-w-[340px]">
                      {/* Status bar do celular */}
                      <div className="absolute top-0 left-0 right-0 h-6 bg-black/40 flex justify-between items-center px-4 text-[8px] text-white/80 z-20 w-full">
                        <div>12:30</div>
                        <div className="flex gap-1">
                          <div className="h-2 w-2 rounded-full bg-white/80"></div>
                          <div className="h-2 w-2 rounded-full bg-white/80"></div>
                          <div className="h-2 w-2 rounded-full bg-white/80"></div>
                          <div className="h-2 w-2 rounded-full bg-white/80"></div>
                        </div>
                      </div>
                      
                      {/* Background do celular - Gradiente que preenche toda a tela */}
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-950/90 z-0 w-full"></div>
                      
                      {/* CONTEÚDO PRINCIPAL - Sem bordas laterais */}
                      <div className="absolute inset-0 flex flex-col z-10 pt-16 overflow-auto w-full">
                        {/* Logo da RPX no topo do app */}
                        <div className="px-3 flex justify-between items-center mb-2 w-full bg-gradient-to-b from-purple-900/80 to-transparent py-3">
                          <div className="flex items-center">
                            <span className="text-3xl font-bold italic text-white tracking-wide">RPX</span>
                          </div>
                          <div className="flex gap-3">
                            <div className="w-6 h-6 bg-purple-600/50 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-purple-300 rounded-full"></div>
                            </div>
                            <div className="w-6 h-6 flex flex-col justify-center gap-[2px]">
                              <div className="w-6 h-[2px] bg-white/70 rounded-full"></div>
                              <div className="w-6 h-[2px] bg-white/70 rounded-full"></div>
                              <div className="w-6 h-[2px] bg-white/70 rounded-full"></div>
                            </div>
                          </div>
                        </div>

                        {/* PATROCINADOR EM DESTAQUE - Totalmente redesenhado e sem bordas */}
                        <div className="px-3 pb-3">
                          <div className="bg-gradient-to-r from-amber-800/40 to-amber-700/40 rounded-xl px-4 py-3 border border-amber-600/30 overflow-hidden relative shadow-lg w-full">
                            <div className="absolute top-0 right-0 rounded-full w-40 h-40 bg-amber-500/10 blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                            <div className="absolute bottom-0 left-0 rounded-full w-40 h-40 bg-yellow-500/10 blur-2xl translate-y-1/2 -translate-x-1/3"></div>
                            
                            <div className="mb-1">
                              <div className="text-[12px] text-amber-300 uppercase tracking-wider font-bold">PATROCINADOR PRINCIPAL</div>
                              <div className="flex justify-between items-center">
                                <h4 className="text-white text-2xl font-bold">LuckBet</h4>
                                <div className="flex">
                                  {Array(5).fill(0).map((_, i) => (
                                    <Star key={i} size={14} color="gold" fill="gold" className="ml-0.5" />
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-2">
                              <div className="w-14 h-14 bg-black/40 rounded-lg flex items-center justify-center">
                                <div className="relative w-12 h-12">
                                  <Image
                                    src="/images/sponsors/luckbet.png"
                                    alt="LuckyBet"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="text-[13px] text-white/90 mb-2 font-medium">Bônus de 200% no primeiro depósito até R$300</p>
                                <button className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold rounded-full py-2 w-full text-[13px]">
                                  ACESSAR AGORA
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Seção de boas-vindas */}
                        <div className="px-3 pt-1 pb-2">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-2xl font-medium text-white">Bem-vindo à RPX!</h3>
                            <div className="px-3 py-1 bg-purple-700/60 rounded-full text-[10px] text-white/90 font-medium">NOVO</div>
                          </div>
                          
                          <div className="relative bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-xl p-4 mb-5 border border-purple-700/20 w-full">
                            <p className="text-[13px] text-white/90 leading-tight">
                              Deslize para conhecer os recursos do app e comece a ganhar com suas apostas em Free Fire
                            </p>
                            <div className="flex justify-center mt-3 space-x-1">
                              <div className="w-12 h-1.5 bg-purple-500 rounded-full"></div>
                              <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full"></div>
                              <div className="w-1.5 h-1.5 bg-purple-500/50 rounded-full"></div>
                            </div>
                            
                            {/* Botão de avançar tutorial */}
                            <div className="absolute -bottom-3 -right-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
                              <ArrowRight size={14} color="white" />
                            </div>
                          </div>
                          
                          {/* Cards de funcionalidades */}
                          <div className="mb-4 flex justify-between items-center w-full">
                            <h4 className="text-[14px] font-semibold text-white uppercase tracking-wider">RECURSOS PRINCIPAIS</h4>
                            <span className="text-[12px] text-purple-400">Ver todos</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-6 w-full">
                            <div className="bg-indigo-900/30 p-3 rounded-xl flex flex-col items-center border border-indigo-800/30 w-full">
                              <div className="w-12 h-12 rounded-full bg-indigo-700/30 flex items-center justify-center mb-2">
                                <Star size={20} color="white" />
                              </div>
                              <span className="text-[14px] text-white font-medium">Apostas</span>
                              <span className="text-[10px] text-blue-300">Bônus 2x</span>
                            </div>
                            <div className="bg-indigo-900/30 p-3 rounded-xl flex flex-col items-center border border-indigo-800/30 w-full">
                              <div className="w-12 h-12 rounded-full bg-indigo-700/30 flex items-center justify-center mb-2">
                                <Users size={20} color="white" />
                              </div>
                              <span className="text-[14px] text-white font-medium">Torneios</span>
                              <span className="text-[10px] text-purple-300">4 ao vivo</span>
                            </div>
                            <div className="bg-indigo-900/30 p-3 rounded-xl flex flex-col items-center border border-indigo-800/30 w-full">
                              <div className="w-12 h-12 rounded-full bg-indigo-700/30 flex items-center justify-center mb-2">
                                <Flag size={20} color="white" />
                              </div>
                              <span className="text-[14px] text-white font-medium">Rankings</span>
                              <span className="text-[10px] text-green-300">Atualizado</span>
                            </div>
                            <div className="bg-indigo-900/30 p-3 rounded-xl flex flex-col items-center border border-indigo-800/30 w-full">
                              <div className="w-12 h-12 rounded-full bg-indigo-700/30 flex items-center justify-center mb-2">
                                <DollarSign size={20} color="white" />
                              </div>
                              <span className="text-[14px] text-white font-medium">Prêmios</span>
                              <span className="text-[10px] text-yellow-300">Resgatar</span>
                            </div>
                          </div>
                          
                          {/* Torneio em destaque */}
                          <div className="mb-4 flex justify-between items-center w-full">
                            <h4 className="text-[14px] font-semibold text-white uppercase tracking-wider">TORNEIO EM DESTAQUE</h4>
                            <span className="text-[12px] text-purple-400">Ver mais</span>
                          </div>
                          
                          <div className="bg-indigo-900/30 rounded-xl p-4 mb-4 border border-indigo-800/30 relative overflow-hidden w-full">
                            <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-purple-500/10 -translate-y-1/2 translate-x-1/2 blur-md"></div>
                            <div className="z-10 relative">
                              <div className="flex justify-between">
                                <div>
                                  <h5 className="text-[15px] font-bold text-white">Free Fire Pro League</h5>
                                  <p className="text-[12px] text-blue-300">Prêmio: R$50.000</p>
                                </div>
                                <div className="bg-amber-800/40 px-2 py-1 h-fit rounded">
                                  <span className="text-[10px] text-amber-300 font-medium">AO VIVO</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center mt-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center">
                                    <span className="text-[8px] text-white">👤</span>
                                  </div>
                                  <span className="text-[10px] text-gray-300">128 jogadores</span>
                                </div>
                                <button className="bg-purple-600 hover:bg-purple-500 transition-colors rounded-full px-4 py-2">
                                  <span className="text-[12px] text-white font-medium">APOSTAR</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Barra de navegação inferior */}
                        <div className="mt-auto">
                          {/* Saldo */}
                          <div className="px-3 mb-3">
                            <span className="text-[12px] text-gray-300 mb-1 block">Seu saldo</span>
                            <div className="bg-indigo-900/30 p-3 rounded-xl border border-indigo-800/30 flex justify-between items-center w-full">                               
                              <p className="text-[18px] font-bold text-white">R$ 250,00</p>
                              <button className="bg-purple-600 hover:bg-purple-500 transition-colors rounded-full px-5 py-2">
                                <span className="text-[12px] text-white font-medium">DEPOSITAR</span>
                              </button>
                            </div>
                          </div>
                          
                          {/* Barra de navegação */}
                          <div className="h-16 bg-gradient-to-r from-indigo-950 to-purple-950 border-t border-indigo-800/20 flex justify-around items-center px-2 w-full">
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-purple-700/80 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                                  <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                                  <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                                </svg>
                              </div>
                              <span className="text-[8px] text-white mt-0.5">Início</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-purple-700/20 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                                  <path fillRule="evenodd" d="M7.5 5.25a3 3 0 013-3h3a3 3 0 013 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0112 15.75c-2.73 0-5.357-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 017.5 5.455V5.25zm7.5 0v.09a49.488 49.488 0 00-6 0v-.09a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5zm-3 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                  <path d="M3 18.4v-2.796a4.3 4.3 0 00.713.31A26.226 26.226 0 0012 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 01-6.477-.427C4.047 21.128 3 19.852 3 18.4z" />
                                </svg>
                              </div>
                              <span className="text-[8px] text-white/60 mt-0.5">Torneios</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-purple-700/20 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                                  <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
                                  <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
                                </svg>
                              </div>
                              <span className="text-[8px] text-white/60 mt-0.5">Social</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="w-7 h-7 rounded-full bg-purple-700/20 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-[8px] text-white/60 mt-0.5">Perfil</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Próximo torneio countdown */}
          <div className="mt-12 py-6 px-8 bg-gradient-to-r from-purple-900/60 to-blue-900/60 backdrop-blur-md rounded-xl mx-auto max-w-4xl transform hover:scale-105 transition-transform duration-500">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Próximo Mega Torneio:</h3>
                <p className="text-purple-300">Campeonato Nacional de Free Fire</p>
              </div>
              
              <div className="flex gap-4 text-center">
                <div className="bg-purple-900/70 backdrop-blur-sm w-16 p-2 rounded-lg">
                  <div className="text-2xl font-bold">{countdown.hours.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-purple-300">Horas</div>
                </div>
                <div className="bg-purple-900/70 backdrop-blur-sm w-16 p-2 rounded-lg">
                  <div className="text-2xl font-bold">{countdown.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-purple-300">Minutos</div>
                </div>
                <div className="bg-purple-900/70 backdrop-blur-sm w-16 p-2 rounded-lg">
                  <div className="text-2xl font-bold">{countdown.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-xs text-purple-300">Segundos</div>
                </div>
              </div>
              
              <Link 
                href="/tournaments/national"
                className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-3 rounded-lg text-white font-semibold hover:from-pink-700 hover:to-purple-700"
              >
                Inscreva-se
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Prêmios e Rankings */}
      <section className="py-10 bg-gradient-to-br from-purple-950 to-indigo-950 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern-rpx.png')] bg-repeat opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-200">
              Sistema de Ranking e Premiações
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Jogue, suba de ranking e concorra a prêmios mensais. Os melhores jogadores recebem recompensas exclusivas.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Challenger Card */}
            <div className="bg-gradient-to-br from-purple-900/60 to-fuchsia-900/30 rounded-xl p-6 border border-purple-600/30 shadow-lg shadow-purple-500/10 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-purple-600/20 blur-2xl group-hover:bg-purple-500/30 transition-all duration-700"></div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">Top 20: Challenger</h3>
                <div className="w-12 h-12 relative">
                  <Image src="/images/ranks/challenger.png" alt="Challenger Rank" width={48} height={48} className="object-contain" />
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                Jogadores já no rank Challenger (top 20) recebem premiações mensais de até <span className="font-semibold text-amber-300">R$ 16.000</span>
              </p>
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center text-xs text-white/70">
                  <Award className="mr-1 text-purple-400" size={14} /> 
                  <span>Premiação mensal</span>
                </div>
                <Link href="/ranking/premios" className="text-xs text-purple-300 hover:text-purple-200 font-medium">
                  Ver tabela completa →
                </Link>
              </div>
            </div>
            
            {/* Legend Card */}
            <div className="bg-gradient-to-br from-indigo-900/60 to-blue-900/30 rounded-xl p-6 border border-indigo-600/30 shadow-lg shadow-indigo-500/10 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-indigo-600/20 blur-2xl group-hover:bg-indigo-500/30 transition-all duration-700"></div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">Top 21-100: Legend</h3>
                <div className="w-12 h-12 relative">
                  <Image src="/images/ranks/legend.png" alt="Legend Rank" width={48} height={48} className="object-contain" />
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                Jogadores no rank Legend (posições 21-100) recebem de <span className="font-semibold text-amber-300">R$ 200</span> a <span className="font-semibold text-amber-300">R$ 1.200</span> em premiações
              </p>
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center text-xs text-white/70">
                  <Award className="mr-1 text-indigo-400" size={14} /> 
                  <span>Premiação mensal</span>
                </div>
                <Link href="/ranking/premios" className="text-xs text-indigo-300 hover:text-indigo-200 font-medium">
                  Ver tabela completa →
                </Link>
              </div>
            </div>
            
            {/* Premiação Total */}
            <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/20 rounded-xl p-6 border border-amber-700/30 shadow-lg shadow-amber-500/10 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-amber-600/10 blur-2xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">Premiação Mensal</h3>
                <div className="w-12 h-12 flex items-center justify-center">
                  <DollarSign size={30} className="text-amber-400" />
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                Mais de <span className="font-semibold text-amber-300">R$ 100.000</span> em prêmios distribuídos mensalmente entre os melhores jogadores da plataforma
              </p>
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center text-xs text-white/70">
                  <Target className="mr-1 text-amber-400" size={14} /> 
                  <span>Classificação contínua</span>
                </div>
                <Link href="/ranking" className="text-xs text-amber-300 hover:text-amber-200 font-medium">
                  Ver ranking atual →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tutorial de como jogar - Seção adicionada */}
      <section className="py-16 px-4 bg-gradient-to-b from-background to-card-bg/40">
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-6 text-white">Como jogar na <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">RPX</span></h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Aprenda em poucos passos como começar a fazer suas apostas e ganhar com a comunidade de Free Fire
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-card-bg/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:transform hover:scale-105 relative">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">1</div>
              <div className="mb-5 mt-3 flex justify-center">
                <User size={50} className="text-primary-light" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Crie sua conta</h3>
              <p className="text-gray-300 text-center mb-4">
                Registre-se gratuitamente na plataforma em menos de 2 minutos. Você só precisa de um e-mail válido e uma senha.
              </p>
              <div className="text-center">
                <Link href="/auth/register" className="text-sm font-medium text-primary hover:text-primary-light transition-colors">
                  Criar conta agora →
                </Link>
              </div>
            </div>
            
            <div className="bg-card-bg/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:transform hover:scale-105 relative">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">2</div>
              <div className="mb-5 mt-3 flex justify-center">
                <DollarSign size={50} className="text-primary-light" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Faça seu depósito</h3>
              <p className="text-gray-300 text-center mb-4">
                Escolha entre Pix, cartão de crédito ou criptomoedas para fazer seu primeiro depósito e ganhar bônus.
              </p>
              <div className="text-center">
                <Link href="/deposit" className="text-sm font-medium text-primary hover:text-primary-light transition-colors">
                  Ver métodos de pagamento →
                </Link>
              </div>
            </div>
            
            <div className="bg-card-bg/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:transform hover:scale-105 relative">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">3</div>
              <div className="mb-5 mt-3 flex justify-center">
                <Target size={50} className="text-primary-light" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Escolha sua aposta</h3>
              <p className="text-gray-300 text-center mb-4">
                Navegue pelos torneios e partidas disponíveis de Free Fire. Selecione o evento e o tipo de aposta desejada.
              </p>
              <div className="text-center">
                <Link href="/matches" className="text-sm font-medium text-primary hover:text-primary-light transition-colors">
                  Ver partidas ao vivo →
                </Link>
              </div>
            </div>
            
            <div className="bg-card-bg/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-primary/40 transition-all duration-300 hover:transform hover:scale-105 relative">
              <div className="absolute -top-5 -left-5 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">4</div>
              <div className="mb-5 mt-3 flex justify-center">
                <Award size={50} className="text-primary-light" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center">Acompanhe e ganhe</h3>
              <p className="text-gray-300 text-center mb-4">
                Assista às partidas ao vivo, torça pelos seus jogadores favoritos e receba os ganhos diretamente em sua conta.
              </p>
              <div className="text-center">
                <Link href="/bets" className="text-sm font-medium text-primary hover:text-primary-light transition-colors">
                  Ver minhas apostas →
                </Link>
              </div>
            </div>
          </div>
          
          <div className="bg-card-bg/60 backdrop-blur-sm border border-primary/30 rounded-xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">Dicas para iniciantes</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <span className="text-primary-light font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">Diversifique suas apostas</h4>
                  <p className="text-gray-300 text-sm">
                    Não coloque todo seu saldo em uma única aposta. Distribua seus riscos entre diferentes partidas e tipos de apostas.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <span className="text-primary-light font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">Aproveite os bônus</h4>
                  <p className="text-gray-300 text-sm">
                    Use os bônus de boas-vindas e promoções para aumentar seu saldo e ter mais oportunidades de ganhar.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                  <span className="text-primary-light font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">Jogue com responsabilidade</h4>
                  <p className="text-gray-300 text-sm">
                    Estabeleça um orçamento para suas apostas e não ultrapasse esse limite. Aposte sempre de forma consciente.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Link 
                href="/guides/beginners" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold inline-block hover:from-purple-700 hover:to-blue-700 transition-colors"
              >
                Ver guia completo para iniciantes
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Estatísticas em destaque */}
      <section className="py-16 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center transform hover:scale-110 transition-transform duration-300">
              <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">+50.000</p>
              <p className="text-gray-300">Jogadores ativos</p>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300">
              <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">R$1.5M</p>
              <p className="text-gray-300">Pagos em prêmios</p>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300">
              <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">+200</p>
              <p className="text-gray-300">Torneios realizados</p>
            </div>
            <div className="text-center transform hover:scale-110 transition-transform duration-300">
              <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">95%</p>
              <p className="text-gray-300">Taxa de satisfação</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Banner de patrocínio */}
      <div className="container mx-auto px-4 my-16">
        <SponsorPromoBanner className="mx-auto transform hover:scale-105 transition-transform duration-500" />
      </div>

      {/* Depoimentos */}
      <section className="py-20 bg-card-bg/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            O que dizem nossos <span className="text-purple-500">jogadores</span>
          </h2>
          <p className="text-center text-gray-300 mb-16 max-w-2xl mx-auto">
            Confira a experiência de quem já faz parte da RPX
          </p>

          <div className="max-w-3xl mx-auto">
            <div className="bg-card-bg border border-gray-700 p-8 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full transform translate-x-20 -translate-y-20"></div>
              
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-purple-500">
                    <Image 
                      src={testimonials[testimonialIndex].avatar} 
                      alt={testimonials[testimonialIndex].name}
                      width={64}
                      height={64}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{testimonials[testimonialIndex].name}</h3>
                    <p className="text-purple-400 text-sm">{testimonials[testimonialIndex].role}</p>
                  </div>
                </div>
                
                <blockquote className="text-lg text-gray-300 italic">
                  "{testimonials[testimonialIndex].text}"
                </blockquote>
                
                <div className="flex justify-center mt-8">
                  {testimonials.map((_, index) => (
                    <button 
                      key={index}
                      onClick={() => setTestimonialIndex(index)}
                      className={`w-3 h-3 rounded-full mx-1 ${index === testimonialIndex ? 'bg-purple-500' : 'bg-gray-600'}`}
                      aria-label={`Ver depoimento ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Redesenhado */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para <span className="text-purple-500">começar</span>?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Registre-se hoje e receba um bônus de R$50 para suas primeiras apostas
          </p>
          
          <Link 
            href="/auth/register" 
            className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-10 py-3 rounded-lg font-semibold inline-block transform transition-transform hover:scale-105"
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

      {/* Links de navegação em desktop */}
      <nav className="hidden md:flex items-center space-x-1">
        <Link 
          href="/demo-ranks/login" 
          className="px-4 py-2 rounded-md text-sm font-medium text-indigo-300 hover:text-primary-light hover:bg-card-hover transition-colors relative"
        >
          Demo Ranks
        </Link>
        <Link 
          href="/demo-users" 
          className="px-4 py-2 rounded-md text-sm font-medium text-orange-300 hover:text-primary-light hover:bg-card-hover transition-colors relative"
        >
          Demo Usuários
        </Link>
      </nav>

    </div>
  );
}
