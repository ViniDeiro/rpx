'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Award, 
  Users, 
  Zap, 
  Target, 
  BarChart2, 
  Star, 
  ChevronRight, 
  Monitor, 
  Phone, 
  Globe, 
  Mail, 
  Info, 
  ArrowRight, 
  ExternalLink 
} from 'react-feather';

// Dados simulados dos patrocinadores
interface Sponsor {
  id: number;
  name: string;
  logo: string;
  description: string;
  website: string;
  featured?: boolean;
  slug: string;
}

interface SponsorCategories {
  platinum: Sponsor[];
  gold: Sponsor[];
  silver: Sponsor[];
}

const sponsors: SponsorCategories = {
  platinum: [
    {
      id: 1,
      name: "Ferjee",
      logo: "/images/ferjee.png",
      description: "Federação de Esports do Rio de Janeiro - Promovendo excelência, inclusão e profissionalização nos esportes eletrônicos cariocas.",
      website: "https://ferjee.com",
      featured: true,
      slug: "ferjee"
    },
    {
      id: 2,
      name: "TechMaster",
      logo: "/images/sponsors/techmaster.png",
      description: "Empresa líder em tecnologia e inovação no mercado brasileiro.",
      website: "https://techmaster.example.com",
      featured: true,
      slug: "techmaster"
    },
    {
      id: 3,
      name: "GameVerse",
      logo: "/images/sponsors/gameverse.png",
      description: "Plataforma premium de jogos e desenvolvimento.",
      website: "https://gameverse.example.com",
      featured: true,
      slug: "gameverse"
    }
  ],
  gold: [
    {
      id: 4,
      name: "DigiByte",
      logo: "/images/sponsors/digibyte.png",
      description: "Soluções digitais para empresas modernas.",
      website: "https://digibyte.example.com",
      slug: "digibyte"
    },
    {
      id: 5,
      name: "PowerPlay",
      logo: "/images/sponsors/powerplay.png",
      description: "Periféricos e equipamentos para gamers profissionais.",
      website: "https://powerplay.example.com",
      slug: "powerplay"
    },
    {
      id: 6,
      name: "NetForce",
      logo: "/images/sponsors/netforce.png",
      description: "Provedora de serviços de internet de alta velocidade.",
      website: "https://netforce.example.com",
      slug: "netforce"
    }
  ],
  silver: [
    {
      id: 7,
      name: "CyberShield",
      logo: "/images/sponsors/cybershield.png",
      description: "Segurança digital para todos os seus dispositivos.",
      website: "https://cybershield.example.com",
      slug: "cybershield"
    },
    {
      id: 8,
      name: "PixelCraft",
      logo: "/images/sponsors/pixelcraft.png",
      description: "Estúdio de design e criação de conteúdo digital.",
      website: "https://pixelcraft.example.com",
      slug: "pixelcraft"
    },
    {
      id: 9,
      name: "StreamFlow",
      logo: "/images/sponsors/streamflow.png",
      description: "Plataforma de streaming e compartilhamento de conteúdo.",
      website: "https://streamflow.example.com",
      slug: "streamflow"
    },
    {
      id: 10,
      name: "DataDrive",
      logo: "/images/sponsors/datadrive.png",
      description: "Serviços de armazenamento e processamento de dados.",
      website: "https://datadrive.example.com",
      slug: "datadrive"
    }
  ]
};

// Depoimentos simulados
const testimonials = [
  {
    id: 1,
    text: "Associar nossa marca ao RPX foi uma das melhores decisões estratégicas que tomamos. O alcance e engajamento são incomparáveis.",
    author: "Ana Silva",
    position: "Diretora de Marketing",
    company: "TechMaster"
  },
  {
    id: 2,
    text: "A visibilidade que ganhamos como patrocinadores do RPX superou todas as expectativas, com ROI mensurável desde o primeiro mês.",
    author: "Carlos Mendes",
    position: "CEO",
    company: "GameVerse"
  },
  {
    id: 3,
    text: "A parceria com RPX nos abriu portas para um segmento de público extremamente valioso e engajado.",
    author: "Fernanda Costa",
    position: "Head de Parcerias",
    company: "PowerPlay"
  }
];

// Estatísticas simuladas da plataforma
const stats = [
  { id: 1, name: "Usuários ativos", value: "150K+", icon: <Users />, color: "bg-blue-500" },
  { id: 2, name: "Partidas mensais", value: "2.5M", icon: <Zap />, color: "bg-green-500" },
  { id: 3, name: "Espectadores", value: "500K+", icon: <Monitor />, color: "bg-yellow-500" },
  { id: 4, name: "Conversão", value: "12.8%", icon: <Target />, color: "bg-red-500" }
];

// Benefícios para os patrocinadores
const sponsorBenefits = {
  platinum: [
    "Logo em destaque na página inicial",
    "Integração completa com todos os eventos",
    "Anúncios em destaque durante torneios",
    "Acesso ao painel de análise de dados",
    "Criação de eventos exclusivos da marca",
    "Acesso à base de usuários premium",
    "Entrevistas exclusivas com jogadores",
    "Presença de marca em todas as transmissões"
  ],
  gold: [
    "Logo na página inicial",
    "Presença em eventos selecionados",
    "Anúncios durante torneios",
    "Relatório mensal de dados",
    "Divulgação em redes sociais",
    "Acesso limitado à base de usuários",
    "Menções durante transmissões"
  ],
  silver: [
    "Logo na página de patrocinadores",
    "Presença em eventos menores",
    "Anúncios rotativos na plataforma",
    "Relatório trimestral de dados",
    "Divulgação pontual em redes sociais"
  ]
};

export default function SponsorsPage() {
  const [activeTab, setActiveTab] = useState<'platinum' | 'gold' | 'silver'>('platinum');
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [featuredSponsor, setFeaturedSponsor] = useState<Sponsor | null>(null);

  // Efeito para alternar entre os depoimentos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setFeaturedSponsor(sponsors.platinum.find(s => s.featured) || null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-purple-900 to-background pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/90 to-background z-10"></div>
          <div className="absolute top-0 left-0 right-0 h-full bg-black/20 opacity-10"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full filter blur-3xl opacity-30 animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600 rounded-full filter blur-3xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-violet-600 rounded-full filter blur-3xl opacity-10 animate-pulse-slow"></div>
        </div>
        
        <div className="relative z-20 max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-300 to-white mb-4 tracking-tight">
            Patrocinadores <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">RPX</span>
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto mb-10 drop-shadow-sm">
            Junte-se às marcas líderes que impulsionam a próxima geração de experiências competitivas
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <a href="#become-sponsor" className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg shadow-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-300 flex items-center transform hover:scale-105 hover:shadow-purple-500/30">
              Torne-se Patrocinador
              <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#benefits" className="px-8 py-3.5 bg-transparent border border-purple-500 text-purple-300 font-medium rounded-lg hover:bg-purple-900/30 transition-all duration-300 hover:border-purple-400 hover:text-white transform hover:scale-105">
              Ver Benefícios
            </a>
          </div>
        </div>
      </section>

      {/* Patrocinador Destacado */}
      <section className="relative py-20 bg-gradient-to-r from-gray-900 via-purple-900/30 to-gray-900 overflow-hidden mb-24">
        <div className="absolute inset-0 bg-black/5 opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2 flex justify-center md:justify-start">
              <div className="w-72 h-72 rounded-2xl bg-transparent overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-700/20 to-indigo-700/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-2xl"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[200px] h-[200px] flex items-center justify-center p-4 rounded-xl shadow-lg transform transition-all duration-500 group-hover:scale-110 bg-black/20 backdrop-blur-sm">
                    <Image 
                      src={featuredSponsor?.logo || '/images/sponsors/placeholder.png'} 
                      alt={featuredSponsor?.name || 'Patrocinador Destacado'}
                      width={180}
                      height={180}
                      className="object-contain filter drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 text-center md:text-left">
              <div className="space-y-6">
                <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-2 bg-purple-900/40 px-3 py-1 rounded-full">Patrocinador Destacado</span>
                
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-purple-300 mb-4">
                  {featuredSponsor?.name || 'FERJEE'}
                </h2>
                
                <p className="text-gray-300 text-lg leading-relaxed mb-6">
                  {featuredSponsor?.description || ''}
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <Link 
                    href={`/sponsors/${featuredSponsor?.slug || ''}`} 
                    className="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 px-6 py-3 rounded-lg text-white font-medium shadow-lg shadow-purple-700/20 hover:shadow-purple-700/40 transition-all duration-300"
                  >
                    Conheça a {featuredSponsor?.name || 'FERJEE'} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                  
                  <a 
                    href={featuredSponsor?.website || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-white/10 hover:bg-white/15 px-6 py-3 rounded-lg text-white font-medium border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300"
                  >
                    Visitar Website <ExternalLink size={16} className="ml-2" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Patrocinadores em Destaque */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {sponsors.platinum.filter(s => s.featured).map((sponsor) => (
              <div 
                key={sponsor.id}
                className="bg-gradient-to-br from-gray-900/80 via-purple-900/20 to-gray-800 rounded-xl shadow-xl overflow-hidden border border-purple-500/30 hover:border-purple-400/50 transition-all duration-500 group hover:shadow-purple-500/20 hover:shadow-2xl transform hover:-translate-y-1"
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-36 h-36 md:w-48 md:h-48 relative bg-gradient-to-br from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl flex items-center justify-center p-4 shadow-inner overflow-hidden group-hover:scale-105 transition-all duration-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-500/10 before:via-transparent before:to-purple-500/10 before:animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent opacity-70 rounded-xl group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-1 bg-gradient-to-tr from-purple-500/10 via-transparent to-purple-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
                    <div className="relative w-full h-full flex items-center justify-center z-10">
                      {/* Exibir a imagem real se existir */}
                      {sponsor.name === "Ferjee" ? (
                        <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 animate-pulse-slow transition-opacity duration-1000 rounded-full blur-2xl"></div>
                          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 animate-pulse-slow transition-opacity duration-1000 rounded-full blur-xl"></div>
                          <Image 
                            src={sponsor.logo} 
                            alt={sponsor.name} 
                            width={160} 
                            height={160} 
                            className="object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] transform group-hover:scale-110 transition-transform duration-500 filter group-hover:brightness-125 z-10"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white/80 group-hover:text-white transition-colors duration-300">
                          {sponsor.name.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start mb-2">
                      <div className="bg-purple-900/50 rounded-full p-1.5 mr-2">
                        <Award size={14} className="text-purple-300" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">Patrocinador Platinum</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight group-hover:text-purple-100 transition-colors duration-300">{sponsor.name}</h3>
                    <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors duration-300">{sponsor.description}</p>
                    {sponsor.name === "Ferjee" ? (
                      <Link 
                        href="/sponsors/ferjee" 
                        className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors bg-purple-900/20 hover:bg-purple-900/40 px-4 py-2 rounded-lg group-hover:shadow-lg group-hover:shadow-purple-500/15 transition-all duration-300"
                      >
                        <Info size={16} className="mr-2" />
                        Conhecer mais
                        <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <a 
                        href={sponsor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors bg-purple-900/20 hover:bg-purple-900/30 px-3 py-1.5 rounded-lg"
                      >
                        <Globe size={16} className="mr-1" />
                        Visitar website
                        <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Estatísticas */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-2 bg-purple-900/30 px-3 py-1 rounded-full">Estatísticas</span>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-4">Alcance Incomparável</h2>
            <div className="h-1 w-28 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-800 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Conecte sua marca com números que impressionam
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div 
                key={stat.id}
                className="bg-gradient-to-br from-gray-900/80 to-purple-900/10 rounded-xl p-6 border border-purple-500/20 transform hover:-translate-y-2 transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-500/30 group"
              >
                <div className="h-16 w-16 mx-auto rounded-lg bg-gradient-to-br from-purple-900/30 to-indigo-900/30 flex items-center justify-center mb-4 border border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                  <div className="text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                    {stat.icon}
                  </div>
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 mb-2 text-center">{stat.value}</h3>
                <p className="text-gray-400 font-medium text-center group-hover:text-gray-300 transition-colors duration-300">{stat.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Níveis de Patrocínio */}
      <section id="sponsors" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-2 bg-purple-900/30 px-3 py-1 rounded-full">Nossas Parcerias</span>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-4">Nossos Patrocinadores</h2>
            <div className="h-1 w-28 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-800 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto">
              Conheça as marcas que tornam possível a melhor experiência para nossa comunidade
            </p>
          </div>
          
          {/* Tabs para os níveis de patrocínio */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex rounded-lg shadow-2xl bg-gradient-to-br from-gray-900/80 to-purple-900/30 p-1.5 border border-purple-500/30 backdrop-blur-sm">
              {['platinum', 'gold', 'silver'].map((level) => (
                <button
                  key={level}
                  onClick={() => setActiveTab(level as 'platinum' | 'gold' | 'silver')}
                  className={`px-6 py-3 text-sm rounded-md font-medium transition-all duration-500 ${
                    activeTab === level 
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-xl transform scale-105' 
                      : 'text-gray-400 hover:text-white hover:bg-purple-900/40'
                  }`}
                >
                  {level === 'platinum' ? 'Platinum' : level === 'gold' ? 'Gold' : 'Silver'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Grid de patrocinadores para o nível selecionado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {sponsors[activeTab as keyof SponsorCategories].map((sponsor: Sponsor) => (
              <div
                key={sponsor.id}
                className="bg-gradient-to-br from-gray-900/80 via-purple-900/10 to-gray-900/80 rounded-xl overflow-hidden border border-purple-500/20 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/15 hover:border-purple-500/40 flex flex-col group transform hover:-translate-y-2"
              >
                <div className="flex-1 p-8">
                  <div className="h-32 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-6 overflow-hidden group-hover:scale-105 transition-all duration-500 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent opacity-70 rounded-xl group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-1000 blur-md"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/5 via-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 animate-pulse-slow transition-opacity duration-1000 rounded-full blur-xl"></div>
                    
                    {sponsor.logo ? (
                      <Image 
                        src={sponsor.logo}
                        alt={sponsor.name}
                        width={100}
                        height={100}
                        className="object-contain z-10 filter drop-shadow-[0_0_10px_rgba(139,92,246,0.4)] transform group-hover:scale-110 transition-transform duration-500 group-hover:brightness-110"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gradient-to-br from-purple-800/50 to-indigo-800/50 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-inner border border-purple-500/20 transform group-hover:scale-110 transition-transform duration-500 group-hover:border-purple-500/40">
                        {sponsor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <div className={`h-2 w-2 rounded-full ${
                      activeTab === 'platinum' ? 'bg-purple-500' : 
                      activeTab === 'gold' ? 'bg-yellow-500' : 'bg-gray-400'
                    } mr-2`}></div>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${
                      activeTab === 'platinum' ? 'text-purple-400' : 
                      activeTab === 'gold' ? 'text-yellow-400' : 'text-gray-400'
                    }`}>
                      Patrocinador {activeTab === 'platinum' ? 'Platinum' : activeTab === 'gold' ? 'Gold' : 'Silver'}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors duration-300">{sponsor.name}</h3>
                  <p className="text-gray-400 text-sm mb-6 flex-1 group-hover:text-gray-300 transition-colors duration-300">{sponsor.description}</p>
                  
                  <div className="mt-auto pt-4 border-t border-purple-500/10">
                    <a 
                      href={sponsor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-purple-400 hover:text-purple-300 text-sm font-medium bg-purple-900/20 hover:bg-purple-900/40 px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-md hover:shadow-purple-500/20 group-hover:translate-y-0 w-full justify-center"
                    >
                      <Globe size={14} className="mr-2" />
                      Visitar website <ChevronRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefícios */}
      <section id="benefits" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-900/30 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 opacity-20"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-2 bg-purple-900/30 px-3 py-1 rounded-full">Vantagens</span>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-4">Benefícios para Patrocinadores</h2>
            <div className="h-1 w-28 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-800 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto">
              Descubra o que cada nível de patrocínio oferece para sua marca
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plano Platinum */}
            <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/30 rounded-xl p-8 border border-purple-600/30 relative group hover:border-purple-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/10 transform hover:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg">
                Premium
              </div>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300 text-center mt-4 mb-6 flex items-center justify-center">
                <Star size={20} className="text-yellow-400 mr-2" />
                Platinum
              </h3>
              <div className="border-t border-purple-900/50 pt-6 mb-6">
                <ul className="space-y-4">
                  {sponsorBenefits.platinum.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-purple-500/30 flex items-center justify-center mt-0.5 border border-purple-500/40">
                        <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                      </div>
                      <span className="ml-3 text-gray-300 group-hover:text-white transition-colors duration-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-white block mb-6">R$ 50.000 <span className="text-sm text-purple-300 font-normal">/mês</span></span>
                <a href="#become-sponsor" className="inline-block w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/30 transform hover:scale-105">
                  Tornar-se Platinum
                </a>
              </div>
            </div>
            
            {/* Plano Gold */}
            <div className="bg-gradient-to-br from-gray-900/80 to-yellow-900/20 rounded-xl p-8 border border-yellow-600/30 relative group hover:border-yellow-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-yellow-500/10 transform hover:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg">
                Popular
              </div>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-yellow-300 text-center mt-4 mb-6 flex items-center justify-center">
                <Star size={20} className="text-yellow-400 mr-2" />
                Gold
              </h3>
              <div className="border-t border-yellow-900/50 pt-6 mb-6">
                <ul className="space-y-4">
                  {sponsorBenefits.gold.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-yellow-500/30 flex items-center justify-center mt-0.5 border border-yellow-500/40">
                        <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      </div>
                      <span className="ml-3 text-gray-300 group-hover:text-white transition-colors duration-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-white block mb-6">R$ 25.000 <span className="text-sm text-yellow-300 font-normal">/mês</span></span>
                <a href="#become-sponsor" className="inline-block w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-medium rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-yellow-500/30 transform hover:scale-105">
                  Tornar-se Gold
                </a>
              </div>
            </div>
            
            {/* Plano Silver */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/30 rounded-xl p-8 border border-gray-600/30 relative group hover:border-gray-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-gray-500/10 transform hover:scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg">
                Iniciante
              </div>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 text-center mt-4 mb-6 flex items-center justify-center">
                <Star size={20} className="text-gray-400 mr-2" />
                Silver
              </h3>
              <div className="border-t border-gray-800 pt-6 mb-6">
                <ul className="space-y-4">
                  {sponsorBenefits.silver.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-gray-500/30 flex items-center justify-center mt-0.5 border border-gray-500/40">
                        <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                      </div>
                      <span className="ml-3 text-gray-300 group-hover:text-white transition-colors duration-300">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-white block mb-6">R$ 10.000 <span className="text-sm text-gray-400 font-normal">/mês</span></span>
                <a href="#become-sponsor" className="inline-block w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-medium rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-gray-500/30 transform hover:scale-105">
                  Tornar-se Silver
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Depoimentos */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 opacity-10"></div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-2 bg-purple-900/30 px-3 py-1 rounded-full">Experiências</span>
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-4">O que nossos patrocinadores dizem</h2>
            <div className="h-1 w-28 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-800 mx-auto mb-6 rounded-full"></div>
            <p className="text-xl text-gray-300 text-center max-w-3xl mx-auto">
              Experiências reais de marcas que confiaram no RPX
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900/90 to-purple-900/20 rounded-xl p-3 border border-purple-500/20 shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
            <div className="relative overflow-hidden rounded-lg">
              <div className="relative flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}>
                {testimonials.map((testimonial, index) => (
                  <div className="min-w-full p-8 md:p-10" key={testimonial.id}>
                    <div className="max-w-4xl mx-auto">
                      <div className="mb-8 flex justify-center">
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={20} className="text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                      <blockquote className="text-xl md:text-2xl text-white text-center font-medium italic mb-8 leading-relaxed">
                        "{testimonial.text}"
                      </blockquote>
                      <div className="text-center">
                        <div className="font-bold text-white text-lg">{testimonial.author}</div>
                        <div className="text-purple-400">{testimonial.position}, {testimonial.company}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center space-x-3 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`h-3 w-3 rounded-full transition-all duration-300 ${
                    index === activeTestimonial ? 'bg-purple-500 w-6' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setActiveTestimonial(index)}
                ></button>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA e Contato */}
      <section id="become-sponsor" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-900/20 to-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 opacity-20"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/5 rounded-full filter blur-3xl animate-pulse-slow"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="bg-gradient-to-br from-gray-900/90 to-purple-900/30 rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 md:p-12">
                <span className="inline-block text-sm uppercase tracking-wider text-purple-400 font-semibold mb-4 bg-purple-900/30 px-3 py-1 rounded-full">Seja Parceiro</span>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300 mb-6">Torne-se um Patrocinador</h2>
                <p className="text-gray-300 mb-8 text-lg">
                  Junte-se às principais marcas que estão definindo o futuro do entretenimento digital e 
                  conecte-se com uma audiência altamente engajada e valiosa.
                </p>
                
                <div className="space-y-8">
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-purple-900/30 to-purple-900/10 flex items-center justify-center mt-1 border border-purple-500/30 group-hover:bg-purple-900/40 transition-all duration-300 group-hover:scale-110 transform">
                      <BarChart2 size={22} className="text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-medium text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">Aumente sua visibilidade</h3>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Presença de marca em uma plataforma com milhões de visualizações mensais.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-purple-900/30 to-purple-900/10 flex items-center justify-center mt-1 border border-purple-500/30 group-hover:bg-purple-900/40 transition-all duration-300 group-hover:scale-110 transform">
                      <Target size={22} className="text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-medium text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">Alcance seu público-alvo</h3>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Conexão direta com uma comunidade engajada e apaixonada.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-purple-900/30 to-purple-900/10 flex items-center justify-center mt-1 border border-purple-500/30 group-hover:bg-purple-900/40 transition-all duration-300 group-hover:scale-110 transform">
                      <Zap size={22} className="text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                    </div>
                    <div className="ml-5">
                      <h3 className="text-lg font-medium text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">Impulsione suas vendas</h3>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">Conversão comprovada e retorno mensurável sobre o investimento.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8 md:p-12 bg-gradient-to-br from-purple-900/40 to-gray-900/60 backdrop-blur-sm border-l border-purple-500/20">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-300 mb-6">Entre em contato conosco</h3>
                <form className="space-y-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">Empresa</label>
                    <input 
                      type="text" 
                      id="company" 
                      className="w-full bg-gray-800/80 border border-purple-500/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300"
                      placeholder="Nome da sua empresa"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Nome completo</label>
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
                  
                  <div>
                    <label htmlFor="interest" className="block text-sm font-medium text-gray-300 mb-1">Interesse</label>
                    <select 
                      id="interest" 
                      className="w-full bg-gray-800/80 border border-purple-500/20 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300"
                    >
                      <option value="">Selecione um nível de patrocínio</option>
                      <option value="platinum">Platinum</option>
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">Mensagem</label>
                    <textarea 
                      id="message" 
                      rows={4} 
                      className="w-full bg-gray-800/80 border border-purple-500/20 rounded-md py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300"
                      placeholder="Conte-nos sobre o seu interesse..."
                    ></textarea>
                  </div>
                  
                  <button type="button" className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg shadow-lg hover:from-purple-500 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/30">
                    Enviar mensagem
                  </button>
                </form>
                
                <div className="mt-8 pt-6 border-t border-purple-900/50">
                  <p className="text-gray-300 text-sm mb-4">Ou entre em contato diretamente:</p>
                  <div className="space-y-3">
                    <a href="mailto:sponsors@rpx.com" className="flex items-center text-gray-300 hover:text-purple-400 transition-colors duration-300 group">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-900/30 to-purple-900/10 flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-900/40 transition-all duration-300 mr-3">
                        <Mail size={14} className="text-purple-400 group-hover:text-purple-300" />
                      </div>
                      sponsors@rpx.com
                    </a>
                    <a href="tel:+551199999999" className="flex items-center text-gray-300 hover:text-purple-400 transition-colors duration-300 group">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-900/30 to-purple-900/10 flex items-center justify-center border border-purple-500/30 group-hover:bg-purple-900/40 transition-all duration-300 mr-3">
                        <Phone size={14} className="text-purple-400 group-hover:text-purple-300" />
                      </div>
                      +55 11 9999-9999
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 