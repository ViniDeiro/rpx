import React, { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface Jogador {
  id: string;
  nome: string;
  avatar: string;
  pontos: number;
  vitorias: number;
  participacoes: number;
  winRate: number;
  kda: number;
  tag: string;
  nivel: number;
}

const jogadores: Jogador[] = [
  {
    id: 'player-001',
    nome: 'FalcãoX',
    avatar: '/avatars/player1.jpg',
    pontos: 1250,
    vitorias: 28,
    participacoes: 45,
    winRate: 62.2,
    kda: 4.8,
    tag: 'PRO',
    nivel: 87
  },
  {
    id: 'player-002',
    nome: 'SnipeElite',
    avatar: '/avatars/player2.jpg',
    pontos: 1120,
    vitorias: 25,
    participacoes: 42,
    winRate: 59.5,
    kda: 4.2,
    tag: 'PRO',
    nivel: 82
  },
  {
    id: 'player-003',
    nome: 'TitanBR',
    avatar: '/avatars/player3.jpg',
    pontos: 980,
    vitorias: 20,
    participacoes: 38,
    winRate: 52.6,
    kda: 3.9,
    tag: 'SEMI-PRO',
    nivel: 75
  },
  {
    id: 'player-004',
    nome: 'FenixGamer',
    avatar: '/avatars/player4.jpg',
    pontos: 920,
    vitorias: 18,
    participacoes: 40,
    winRate: 45.0,
    kda: 3.5,
    tag: 'SEMI-PRO',
    nivel: 72
  },
  {
    id: 'player-005',
    nome: 'LendárioFF',
    avatar: '/avatars/player5.jpg',
    pontos: 850,
    vitorias: 15,
    participacoes: 35,
    winRate: 42.9,
    kda: 3.2,
    tag: 'SEMI-PRO',
    nivel: 68
  },
  {
    id: 'player-006',
    nome: 'RapidoXD',
    avatar: '/avatars/player6.jpg',
    pontos: 780,
    vitorias: 14,
    participacoes: 32,
    winRate: 43.8,
    kda: 3.0,
    tag: 'COMPETITIVO',
    nivel: 62
  },
  {
    id: 'player-007',
    nome: 'HawkEye',
    avatar: '/avatars/player7.jpg',
    pontos: 720,
    vitorias: 12,
    participacoes: 30,
    winRate: 40.0,
    kda: 2.8,
    tag: 'COMPETITIVO',
    nivel: 58
  },
  {
    id: 'player-008',
    nome: 'ShadowKiller',
    avatar: '/avatars/player8.jpg',
    pontos: 680,
    vitorias: 10,
    participacoes: 28,
    winRate: 35.7,
    kda: 2.7,
    tag: 'COMPETITIVO',
    nivel: 55
  },
  {
    id: 'player-009',
    nome: 'VentoVeloz',
    avatar: '/avatars/player9.jpg',
    pontos: 620,
    vitorias: 9,
    participacoes: 25,
    winRate: 36.0,
    kda: 2.5,
    tag: 'AMADOR',
    nivel: 50
  },
  {
    id: 'player-010',
    nome: 'NovaEstrela',
    avatar: '/avatars/player10.jpg',
    pontos: 550,
    vitorias: 7,
    participacoes: 22,
    winRate: 31.8,
    kda: 2.2,
    tag: 'AMADOR',
    nivel: 45
  }
];

type OrdenarPor = 'pontos' | 'vitorias' | 'winRate' | 'kda';

const RankingsPage: React.FC = () => {
  const [filtro, setFiltro] = useState<string>('todos');
  const [ordenarPor, setOrdenarPor] = useState<OrdenarPor>('pontos');
  const [termo, setTermo] = useState<string>('');

  const jogadoresFiltrados = jogadores
    .filter(jogador => {
      if (filtro === 'todos') return true;
      return jogador.tag === filtro;
    })
    .filter(jogador => 
      jogador.nome.toLowerCase().includes(termo.toLowerCase())
    )
    .sort((a, b) => b[ordenarPor] - a[ordenarPor]);

  return (
    <div className="min-h-screen bg-rpx-dark text-rpx-light">
      <Head>
        <title>Rankings | RPX - Plataforma de Competições e Apostas de Free Fire</title>
        <meta name="description" content="Confira os melhores jogadores de Free Fire na plataforma RPX" />
      </Head>

      <Header />

      <main className="py-10">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-heading">Rankings de Jogadores</h1>
          
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex space-x-4">
              <button 
                className={`px-4 py-2 rounded ${filtro === 'todos' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                onClick={() => setFiltro('todos')}
              >
                Todos
              </button>
              <button 
                className={`px-4 py-2 rounded ${filtro === 'PRO' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                onClick={() => setFiltro('PRO')}
              >
                Pro
              </button>
              <button 
                className={`px-4 py-2 rounded ${filtro === 'SEMI-PRO' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                onClick={() => setFiltro('SEMI-PRO')}
              >
                Semi-Pro
              </button>
              <button 
                className={`px-4 py-2 rounded ${filtro === 'COMPETITIVO' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                onClick={() => setFiltro('COMPETITIVO')}
              >
                Competitivo
              </button>
              <button 
                className={`px-4 py-2 rounded ${filtro === 'AMADOR' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                onClick={() => setFiltro('AMADOR')}
              >
                Amador
              </button>
            </div>
            
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar jogador..."
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded"
              />
            </div>
          </div>
          
          <div className="bg-rpx-blue/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-rpx-blue/40 text-left">
                    <th className="p-4">Posição</th>
                    <th className="p-4">Jogador</th>
                    <th className="p-4 cursor-pointer" onClick={() => setOrdenarPor('pontos')}>
                      <div className="flex items-center">
                        Pontos
                        {ordenarPor === 'pontos' && <span className="ml-1">▼</span>}
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer" onClick={() => setOrdenarPor('vitorias')}>
                      <div className="flex items-center">
                        Vitórias
                        {ordenarPor === 'vitorias' && <span className="ml-1">▼</span>}
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer" onClick={() => setOrdenarPor('winRate')}>
                      <div className="flex items-center">
                        Win Rate
                        {ordenarPor === 'winRate' && <span className="ml-1">▼</span>}
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer" onClick={() => setOrdenarPor('kda')}>
                      <div className="flex items-center">
                        KDA
                        {ordenarPor === 'kda' && <span className="ml-1">▼</span>}
                      </div>
                    </th>
                    <th className="p-4">Participações</th>
                    <th className="p-4">Nível</th>
                  </tr>
                </thead>
                <tbody>
                  {jogadoresFiltrados.map((jogador, index) => (
                    <tr 
                      key={jogador.id} 
                      className={`border-t border-white/10 hover:bg-rpx-blue/30 ${index < 3 ? 'bg-rpx-orange/20' : ''}`}
                    >
                      <td className="p-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rpx-blue/40 font-bold">
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-rpx-blue/30 overflow-hidden mr-3">
                            {/* Placeholder para avatar */}
                            <div className="w-full h-full bg-rpx-blue/70 flex items-center justify-center">
                              {jogador.nome.charAt(0)}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold flex items-center">
                              {jogador.nome}
                              <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                jogador.tag === 'PRO' ? 'bg-yellow-500 text-black' :
                                jogador.tag === 'SEMI-PRO' ? 'bg-blue-500 text-white' :
                                jogador.tag === 'COMPETITIVO' ? 'bg-green-500 text-white' :
                                'bg-gray-500 text-white'
                              }`}>
                                {jogador.tag}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold">
                        {jogador.pontos}
                      </td>
                      <td className="p-4">
                        {jogador.vitorias}
                      </td>
                      <td className="p-4">
                        {jogador.winRate}%
                      </td>
                      <td className="p-4">
                        {jogador.kda.toFixed(1)}
                      </td>
                      <td className="p-4">
                        {jogador.participacoes}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-rpx-orange flex items-center justify-center mr-2">
                            {jogador.nivel}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-rpx-blue/20 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 font-heading">Premiações do Ranking</h2>
              <p className="mb-4">Os jogadores mais bem colocados nos rankings recebem premiações mensais:</p>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold mr-3">1</span>
                  <span>1º Lugar - R$5.000,00 + Lootbox Lendário</span>
                </li>
                <li className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-gray-300 text-black flex items-center justify-center font-bold mr-3">2</span>
                  <span>2º Lugar - R$2.500,00 + Lootbox Épico</span>
                </li>
                <li className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-orange-700 text-white flex items-center justify-center font-bold mr-3">3</span>
                  <span>3º Lugar - R$1.000,00 + Lootbox Raro</span>
                </li>
                <li className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-rpx-blue/40 text-white flex items-center justify-center font-bold mr-3">4</span>
                  <span>4º ao 10º Lugar - R$300,00 + Lootbox Comum</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-rpx-blue/20 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4 font-heading">Como Subir no Ranking</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-rpx-orange flex items-center justify-center mr-3 mt-1">1</div>
                  <div>
                    <h3 className="font-bold">Participe de Torneios</h3>
                    <p className="text-sm text-white/80">Quanto mais torneios você participar, mais pontos poderá acumular.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-rpx-orange flex items-center justify-center mr-3 mt-1">2</div>
                  <div>
                    <h3 className="font-bold">Melhore seu KDA</h3>
                    <p className="text-sm text-white/80">Um bom desempenho individual garante pontos extras no ranking.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-rpx-orange flex items-center justify-center mr-3 mt-1">3</div>
                  <div>
                    <h3 className="font-bold">Vença Torneios</h3>
                    <p className="text-sm text-white/80">Vitórias garantem uma quantidade significativa de pontos.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-rpx-orange flex items-center justify-center mr-3 mt-1">4</div>
                  <div>
                    <h3 className="font-bold">Suba de Nível</h3>
                    <p className="text-sm text-white/80">Jogadores de nível mais alto recebem bonificações nos torneios.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RankingsPage; 