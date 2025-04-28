import React from 'react';
import Image from 'next/image';
import { Users, Code, Cpu } from 'react-feather';

const equipe = [
  {
    nome: 'YgorX',
    cargo: 'Sócio-Fundador & CEO',
    foto: '/images/team/ygor.jpg',
    descricao: 'Responsável pela visão, estratégia e liderança do projeto RPX. Apaixonado por tecnologia, inovação e eSports.'
  },
  {
    nome: 'Dacruz',
    cargo: 'Sócio & CTO',
    foto: '/images/team/dacruz.jpg',
    descricao: 'Lidera o desenvolvimento técnico da plataforma, garantindo performance, segurança e escalabilidade.'
  }
];

export default function Sobre() {
  return (
    <div className="min-h-screen bg-background text-foreground py-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden mb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-background"></div>
        <div className="container mx-auto px-4 relative z-10 py-16">
          <h1 className="text-5xl font-bold text-center mb-6">
            Quem Somos
          </h1>
          <p className="text-center text-xl text-gray-300 max-w-3xl mx-auto">
            A RPX é fruto de uma parceria entre empreendedores apaixonados por games e a excelência em desenvolvimento da Deiro's Dev.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Seção Sócios */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-4">Sócios Fundadores</h2>
          <p className="text-center text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
            Conheça os visionários por trás da RPX
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {equipe.map((socio, idx) => (
              <div key={idx} className="bg-card-bg border border-gray-800 rounded-2xl p-8 flex flex-col items-center shadow-lg hover:shadow-purple-900/20 transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-600 mb-6 shadow-xl relative">
                  <Image 
                    src={socio.foto} 
                    alt={socio.nome} 
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 128px) 100vw, 128px"
                    priority
                  />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{socio.nome}</h2>
                <h3 className="text-purple-400 font-medium mb-4">{socio.cargo}</h3>
                <p className="text-gray-300 text-center">{socio.descricao}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Seção Desenvolvimento */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-4">Desenvolvimento</h2>
          <div className="bg-card-bg border border-gray-800 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-shrink-0">
                <Image 
                  src="/images/deiros-dev-logo.png" 
                  alt="Deiro's Dev Logo" 
                  width={200} 
                  height={80} 
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-4">Deiro's Dev</h3>
                <p className="text-gray-300 mb-6">
                  Responsável por todo o design e desenvolvimento frontend da plataforma, 
                  a Deiro's Dev traz sua expertise em criar interfaces modernas e intuitivas 
                  para proporcionar a melhor experiência aos usuários.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-purple-900/30 px-4 py-2 rounded-full">
                    <Code size={16} className="text-purple-400" />
                    <span className="text-sm text-gray-300">Frontend Development</span>
                  </div>
                  <div className="flex items-center gap-2 bg-purple-900/30 px-4 py-2 rounded-full">
                    <Users size={16} className="text-purple-400" />
                    <span className="text-sm text-gray-300">UI/UX Design</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Em Breve */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Em Breve</h2>
          <p className="text-gray-400 mb-8">
            Nossa equipe está crescendo! Em breve apresentaremos os novos talentos que estão se juntando ao projeto.
          </p>
          <div className="flex justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 bg-purple-900/30 px-6 py-3 rounded-xl">
              <Cpu size={20} className="text-purple-400" />
              <span className="text-gray-300">Backend Team</span>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium transition-colors">
            <span>Voltar para a Home</span>
          </a>
        </div>
      </div>
    </div>
  );
} 