'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Award, 
  Check, 
  Users, 
  Globe, 
  Mail, 
  MapPin, 
  Phone, 
  Shield, 
  Star, 
  Zap,
  Flag,
  Target,
  Heart
} from 'react-feather';

// Dados do carrossel
const carouselImages = [
  {
    src: "/images/ct/imagem1.jpg",
    title: "Estações de jogo profissionais",
    description: "Computadores de alta performance para treinamentos competitivos"
  },
  {
    src: "/images/ct/imagem2.jpg",
    title: "Setup gamer completo",
    description: "Monitores, periféricos e cadeiras para máximo conforto e desempenho"
  },
  {
    src: "/images/ct/imagem3.jpg",
    title: "Ambiente para treinamento",
    description: "Espaço adequado para treinos de equipes e jogadores"
  },
  {
    src: "/images/ct/imagem4.jpg",
    title: "Game House RPX",
    description: "Estrutura completa para desenvolvimento de talentos"
  },
  {
    src: "/images/ct/imagem5.jpg",
    title: "Área de competições",
    description: "Local preparado para disputas e torneios internos"
  },
  {
    src: "/images/ct/imagem6.jpg",
    title: "Tecnologia avançada",
    description: "Equipamentos de última geração para os melhores resultados"
  },
];

export default function FerjeePage() {
  // Estado para controlar qual imagem está ativa no carrossel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Função para avançar para a próxima imagem
  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === carouselImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Função para voltar para a imagem anterior
  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1
    );
  };

  // Função para ir diretamente para uma imagem específica
  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-purple-900 to-background pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/90 to-background z-10"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full filter blur-3xl opacity-30 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600 rounded-full filter blur-3xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-violet-600 rounded-full filter blur-3xl opacity-10 animate-pulse-slow"></div>
        </div>
        
        <div className="relative z-20 max-w-7xl mx-auto">
          <div className="py-4">
            <Link 
              href="/sponsors" 
              className="inline-flex items-center text-purple-300 hover:text-white mb-8 transition-colors bg-purple-900/30 hover:bg-purple-900/50 px-4 py-2 rounded-lg backdrop-blur-sm group"
            >
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar para Parceiros
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="w-full md:w-1/2">
              <div className="flex items-center mb-4">
                <div className="bg-purple-800/50 rounded-full p-1.5 mr-2 backdrop-blur-sm">
                  <Award size={20} className="text-purple-300" />
                </div>
                <span className="text-sm uppercase tracking-wider text-purple-300 font-semibold">Parceiro Platinum</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 mb-4 tracking-tight">
                FERJEE
              </h1>
              <p className="text-xl text-purple-100 mb-6 drop-shadow-sm">
                Federação de Esports do Rio de Janeiro - Promovendo a excelência e inclusão nos esportes eletrônicos cariocas.
              </p>
              <div className="space-y-4 mb-8 bg-purple-900/20 p-4 rounded-lg backdrop-blur-sm border border-purple-500/20">
                <div className="flex items-center">
                  <div className="bg-purple-800/40 rounded-full p-1.5 mr-3">
                    <Globe size={16} className="text-purple-300" />
                  </div>
                  <a href="https://ferjee.com" target="_blank" rel="noopener noreferrer" className="text-purple-100 hover:text-white transition-colors">
                    ferjee.com
                  </a>
                </div>
                <div className="flex items-center">
                  <div className="bg-purple-800/40 rounded-full p-1.5 mr-3">
                    <MapPin size={16} className="text-purple-300" />
                  </div>
                  <span className="text-purple-100">Rio de Janeiro, Brasil</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-purple-800/40 rounded-full p-1.5 mr-3">
                    <Mail size={16} className="text-purple-300" />
                  </div>
                  <a href="mailto:contato@ferjee.com" className="text-purple-100 hover:text-white transition-colors">
                    contato@ferjee.com
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="#contato" 
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 hover:shadow-purple-500/30 hover:scale-105 transform"
                >
                  Entrar em Contato
                </a>
                <a 
                  href="#missao" 
                  className="px-6 py-3 bg-transparent border border-purple-500 text-purple-300 font-medium rounded-lg hover:bg-purple-900/30 transition-all duration-300 hover:text-white hover:border-purple-400 hover:scale-105 transform"
                >
                  Nossa Missão
                </a>
              </div>
            </div>
            <div className="w-full md:w-1/2 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 p-8 rounded-xl shadow-2xl backdrop-blur-sm border border-purple-500/20 hover:border-purple-500/30 transition-all duration-500 hover:shadow-purple-500/20 group relative">
              <div className="absolute inset-x-0 -top-10 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <div className="w-40 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-sm"></div>
              </div>
              <div className="absolute inset-x-0 -bottom-10 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <div className="w-40 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-sm"></div>
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-1000 blur-xl"></div>
              
              <div className="relative aspect-square w-full rounded-lg overflow-hidden mb-4 mx-auto max-w-[320px]">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-70 z-10 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-5"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 animate-pulse-slow transition-opacity duration-1000 rounded-full blur-xl"></div>
                
                <Image 
                  src="/images/ferjee.png" 
                  alt="FERJEE Logo" 
                  fill
                  className="object-contain z-20 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.6)] group-hover:scale-110 transition-transform duration-700 group-hover:brightness-125"
                  priority
                />
                
                {/* Círculos decorativos */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-600/10 rounded-full filter blur-xl opacity-60 animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600/10 rounded-full filter blur-xl opacity-60 animate-pulse-slow"></div>
                <div className="absolute top-1/3 left-1/3 w-16 h-16 bg-violet-600/10 rounded-full filter blur-xl opacity-50 animate-pulse-slow"></div>
              </div>
              
              <div className="mt-6 text-center text-purple-200 text-sm italic bg-purple-900/30 p-2 rounded-lg backdrop-blur-sm">
                Federação de Esports do Rio de Janeiro
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sobre a FERJEE */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 w-1/3 h-full bg-gradient-to-r from-purple-900/5 to-transparent"></div>
          <div className="absolute right-0 w-1/3 h-full bg-gradient-to-l from-purple-900/5 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300 mb-4">A Nova FERJEE</h2>
              <div className="h-1 w-20 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-800 mb-8 rounded-full"></div>
            </div>
            <div className="lg:col-span-2 text-gray-300 space-y-6">
              <p className="text-lg leading-relaxed">
                A nova FERJEE surge com valores renovados e pilares fortes, com uma direção empenhada em trabalhar em estreita colaboração com organizações e jogadores para alcançar objetivos comuns. Nosso foco central é a parceria com as partes interessadas da comunidade, reconhecendo a importância da cooperação mútua para a criação de soluções duradouras e benefícios para todos.
              </p>
              <p className="text-lg leading-relaxed">
                Nos esforçamos para ser um agente positivo no cenário de esports do Rio de Janeiro, mantendo o compromisso com a ética, a transparência e a responsabilidade em todas as nossas operações.
              </p>
              <p className="text-lg leading-relaxed">
                A nova gestão da FERJEE tem como objetivo fazer com que todos os cidadãos do Rio de Janeiro reconheçam a importância dos esports em nossa sociedade.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-lg p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 group transform hover:scale-105">
                  <div className="h-12 w-12 rounded-lg bg-purple-900/40 flex items-center justify-center mb-4 group-hover:bg-purple-900/60 transition-colors duration-300">
                    <Shield size={24} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300">Integridade</h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                    Compromisso com a ética, transparência e responsabilidade em todas as nossas operações e competições.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-lg p-6 border border-gray-800 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 group transform hover:scale-105">
                  <div className="h-12 w-12 rounded-lg bg-purple-900/40 flex items-center justify-center mb-4 group-hover:bg-purple-900/60 transition-colors duration-300">
                    <Users size={24} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300">Inclusão</h3>
                  <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                    Promovemos a diversidade e garantimos que todos tenham a oportunidade de participar em um ambiente justo e respeitoso.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Missão */}
      <section id="missao" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-900/10 to-transparent relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
        <div className="absolute -inset-2 bg-[url('/images/grid-pattern.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-2 bg-purple-900/30 px-3 py-1 rounded-full">Nossa Visão</span>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-4">Nossa Missão</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-800 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Incentivando a profissionalização e promovendo valores fundamentais nos esports
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/10 group transform hover:-translate-y-2">
              <div className="p-8">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-900/40 to-indigo-900/40 flex items-center justify-center mb-6 group-hover:bg-purple-800/50 transition-colors duration-500 group-hover:scale-110 transform">
                  <Star size={32} className="text-purple-300 group-hover:text-purple-100 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">Profissionalização</h3>
                <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300">
                  Incentivamos a profissionalização do cenário de esports no Rio de Janeiro, criando oportunidades para jogadores e equipes.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <div className="bg-purple-900/40 rounded-full p-1 mr-2 mt-0.5 group-hover:bg-purple-800/60 transition-colors duration-300">
                      <Check size={12} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Apoio a jogadores talentosos</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-purple-900/40 rounded-full p-1 mr-2 mt-0.5 group-hover:bg-purple-800/60 transition-colors duration-300">
                      <Check size={12} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Suporte a equipes emergentes</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-purple-900/40 rounded-full p-1 mr-2 mt-0.5 group-hover:bg-purple-800/60 transition-colors duration-300">
                      <Check size={12} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Organização de eventos competitivos</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/10 group transform hover:-translate-y-2">
              <div className="p-8">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-900/40 to-indigo-900/40 flex items-center justify-center mb-6 group-hover:bg-purple-800/50 transition-colors duration-500 group-hover:scale-110 transform">
                  <Heart size={32} className="text-purple-300 group-hover:text-purple-100 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">Inclusão e Diversidade</h3>
                <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300">
                  Promovemos a inclusão, a diversidade e a integridade nos esportes eletrônicos do Rio de Janeiro.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <div className="bg-purple-900/40 rounded-full p-1 mr-2 mt-0.5 group-hover:bg-purple-800/60 transition-colors duration-300">
                      <Check size={12} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Igualdade de oportunidades</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-purple-900/40 rounded-full p-1 mr-2 mt-0.5 group-hover:bg-purple-800/60 transition-colors duration-300">
                      <Check size={12} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Ambiente seguro e respeitoso</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-purple-900/40 rounded-full p-1 mr-2 mt-0.5 group-hover:bg-purple-800/60 transition-colors duration-300">
                      <Check size={12} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Projetos sociais inclusivos</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500/30 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/10 group transform hover:-translate-y-2">
              <div className="p-8">
                <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-900/40 to-indigo-900/40 flex items-center justify-center mb-6 group-hover:bg-purple-800/50 transition-colors duration-500 group-hover:scale-110 transform">
                  <Flag size={32} className="text-purple-300 group-hover:text-purple-100 transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">Identidade Carioca</h3>
                <p className="text-gray-400 mb-6 group-hover:text-gray-300 transition-colors duration-300">
                  Unimos os esports com as tradições cariocas, criando um legado único para as futuras gerações.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <div className="bg-purple-900/40 rounded-full p-1 mr-2 mt-0.5 group-hover:bg-purple-800/60 transition-colors duration-300">
                      <Check size={12} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Valorização da cultura local</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-purple-900/40 rounded-full p-1 mr-2 mt-0.5 group-hover:bg-purple-800/60 transition-colors duration-300">
                      <Check size={12} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Eventos em locais emblemáticos</span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-purple-900/40 rounded-full p-1 mr-2 mt-0.5 group-hover:bg-purple-800/60 transition-colors duration-300">
                      <Check size={12} className="text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                    </div>
                    <span className="text-gray-300 group-hover:text-white transition-colors duration-300">Integração com a comunidade carioca</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Por que patrocinamos o RPX */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent"></div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900/90 to-purple-900/20 rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl p-10 md:p-14 backdrop-blur-sm relative">
            <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-5"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full filter blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full filter blur-3xl"></div>
            
            <div className="max-w-3xl mx-auto text-center relative">
              <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-4 bg-purple-900/30 px-3 py-1 rounded-full">Parceria Estratégica</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 drop-shadow-sm">Por que patrocinamos o RPX</h2>
              <div className="bg-gradient-to-br from-gray-900/70 to-transparent p-8 rounded-xl border border-purple-500/10 mb-10">
                <p className="text-xl text-gray-300 leading-relaxed italic">
                  "Na FERJEE, acreditamos que o futuro dos esports passa pela cooperação e parceria com plataformas inovadoras como o RPX. Nossa colaboração reflete nosso compromisso com o desenvolvimento do cenário competitivo, oferecendo aos jogadores cariocas mais oportunidades de crescimento e visibilidade. Juntos, estamos moldando um ecossistema de esports mais forte, diverso e profissional."
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-4 bg-purple-900/20 p-4 rounded-xl backdrop-blur-sm border border-purple-500/10">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-800 to-indigo-800 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    CA
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold text-white">Cadu Albuquerque</div>
                    <div className="text-purple-300">Presidente da FERJEE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Iniciativas */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-900/10 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-3"></div>
        <div className="absolute -inset-2 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/5 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-indigo-600/5 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-2 bg-purple-900/30 px-3 py-1 rounded-full">Nossos Projetos</span>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-4">Nossas Iniciativas</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-800 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Conheça os principais projetos que estamos desenvolvendo para fortalecer o cenário de esports no Rio de Janeiro
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-xl overflow-hidden border border-purple-500/20 shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-500 group transform hover:-translate-y-1">
              <div className="p-8">
                <div className="flex items-start">
                  <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-purple-800/30 to-indigo-800/30 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/10 group-hover:bg-purple-800/50 transition-all duration-500 group-hover:scale-110 transform">
                    <Target size={28} className="text-purple-300 group-hover:text-purple-100 transition-colors duration-300" />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">Campeonatos Regionais</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Organizamos competições em diversos jogos populares, oferecendo uma plataforma para jogadores locais mostrarem seu talento e se desenvolverem profissionalmente. Nossos campeonatos incluem premiações atrativas e oportunidades de visibilidade.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-xl overflow-hidden border border-purple-500/20 shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-500 group transform hover:-translate-y-1">
              <div className="p-8">
                <div className="flex items-start">
                  <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-purple-800/30 to-indigo-800/30 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/10 group-hover:bg-purple-800/50 transition-all duration-500 group-hover:scale-110 transform">
                    <Users size={28} className="text-purple-300 group-hover:text-purple-100 transition-colors duration-300" />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">Programas de Capacitação</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Desenvolvemos workshops, cursos e mentorias para profissionalizar diversos aspectos do ecossistema de esports: jogadores, técnicos, narradores, produtores e gestores de equipes, criando um ambiente mais preparado e estruturado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-xl overflow-hidden border border-purple-500/20 shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-500 group transform hover:-translate-y-1">
              <div className="p-8">
                <div className="flex items-start">
                  <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-purple-800/30 to-indigo-800/30 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/10 group-hover:bg-purple-800/50 transition-all duration-500 group-hover:scale-110 transform">
                    <Heart size={28} className="text-purple-300 group-hover:text-purple-100 transition-colors duration-300" />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">Projetos Sociais</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Promovemos a inclusão através de iniciativas que utilizam os esports como ferramenta de desenvolvimento social, levando tecnologia, educação e oportunidades a comunidades do Rio de Janeiro, com foco especial em jovens de áreas vulneráveis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/20 rounded-xl overflow-hidden border border-purple-500/20 shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 transition-all duration-500 group transform hover:-translate-y-1">
              <div className="p-8">
                <div className="flex items-start">
                  <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-purple-800/30 to-indigo-800/30 flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/10 group-hover:bg-purple-800/50 transition-all duration-500 group-hover:scale-110 transform">
                    <Globe size={28} className="text-purple-300 group-hover:text-purple-100 transition-colors duration-300" />
                  </div>
                  <div className="ml-6">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">Hub de Inovação</h3>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                      Criamos um espaço para conectar talentos, empresas e investidores do ecossistema de esports, fomentando o desenvolvimento de novas tecnologias, empreendimentos e soluções para o mercado de jogos eletrônicos no Rio de Janeiro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Centro de Treinamento */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-900/10 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-3"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-2 bg-purple-900/30 px-3 py-1 rounded-full">Instalações</span>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-4">Nossa Game House</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-800 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Conheça nosso espaço para treinos e desenvolvimento de talentos do esports
            </p>
          </div>
          
          {/* Carrossel de imagens */}
          <div className="relative max-w-4xl mx-auto">
            {/* Imagens do carrossel */}
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border-2 border-purple-500/30 shadow-xl shadow-purple-900/20">
              {carouselImages.map((image, index) => (
                <div 
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentImageIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <Image 
                    src={image.src}
                    alt={image.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <h3 className="text-2xl font-bold text-white mb-2">{image.title}</h3>
                    <p className="text-lg text-gray-300">
                      {image.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Controles do carrossel */}
            <div className="absolute top-1/2 left-4 -translate-y-1/2 z-20">
              <button 
                onClick={prevImage}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-800/80 backdrop-blur-sm text-white shadow-lg hover:bg-purple-700 transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            </div>
            
            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20">
              <button 
                onClick={nextImage}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-800/80 backdrop-blur-sm text-white shadow-lg hover:bg-purple-700 transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            
            {/* Indicadores */}
            <div className="flex justify-center mt-6 space-x-2">
              {carouselImages.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-purple-500' : 'bg-gray-600 hover:bg-purple-400'
                  }`}
                  aria-label={`Ir para imagem ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-900/10 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-3"></div>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-2 bg-purple-900/30 px-3 py-1 rounded-full">Fale Conosco</span>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-4">Entre em Contato</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-800 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Interessado em participar ou apoiar nossas iniciativas? Entre em contato com nossa equipe.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-gradient-to-br from-gray-900/80 to-purple-900/20 p-8 rounded-xl border border-purple-500/20 hover:border-purple-500/30 transition-all duration-500 shadow-lg hover:shadow-purple-500/10 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-6">Informações de Contato</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-800/30 to-indigo-800/30 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                    <MapPin size={20} className="text-purple-300" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-medium mb-1">Endereço</h4>
                    <p className="text-gray-400">
                      Av. Rio Branco, 156, 20º andar<br />
                      Centro, Rio de Janeiro - RJ<br />
                      CEP: 20040-901
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-800/30 to-indigo-800/30 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                    <Phone size={20} className="text-purple-300" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-medium mb-1">Telefone</h4>
                    <p className="text-gray-400">
                      +55 (21) 3030-5000
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-800/30 to-indigo-800/30 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                    <Mail size={20} className="text-purple-300" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-medium mb-1">Email</h4>
                    <p className="text-gray-400">
                      contato@ferjee.com<br />
                      parcerias@ferjee.com
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-800/30 to-indigo-800/30 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                    <Zap size={20} className="text-purple-300" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-white font-medium mb-1">Horário de Atendimento</h4>
                    <p className="text-gray-400">
                      Segunda a Sexta: 09:00 - 18:00<br />
                      Sábado e Domingo: Fechado
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-3 bg-gradient-to-br from-gray-900/80 to-purple-900/20 p-8 rounded-xl border border-purple-500/20 hover:border-purple-500/30 transition-all duration-500 shadow-lg hover:shadow-purple-500/10 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-6">Envie uma Mensagem</h3>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome</label>
                    <input 
                      type="text" 
                      id="name" 
                      className="w-full bg-gray-800/80 border border-purple-500/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      className="w-full bg-gray-800/80 border border-purple-500/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-300 mb-1">Organização/Equipe</label>
                  <input 
                    type="text" 
                    id="organization" 
                    className="w-full bg-gray-800/80 border border-purple-500/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300"
                    placeholder="Nome da sua organização ou equipe"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-1">Assunto</label>
                  <select 
                    id="subject" 
                    className="w-full bg-gray-800/80 border border-purple-500/20 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300"
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="campeonatos">Campeonatos</option>
                    <option value="capacitacao">Programas de Capacitação</option>
                    <option value="projetos">Projetos Sociais</option>
                    <option value="parceria">Parcerias</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Mensagem</label>
                  <textarea 
                    id="message" 
                    rows={5} 
                    className="w-full bg-gray-800/80 border border-purple-500/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300"
                    placeholder="Como podemos ajudar você?"
                  ></textarea>
                </div>
                
                <button type="button" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105">
                  Enviar Mensagem
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 