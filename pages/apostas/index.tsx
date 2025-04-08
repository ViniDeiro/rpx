import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface Partida {
  id: string;
  timeA: string;
  timeB: string;
  data: string;
  horario: string;
  oddA: number;
  oddB: number;
  campeonato: string;
  ao_vivo: boolean;
}

const partidas: Partida[] = [
  {
    id: 'match-001',
    timeA: 'Fluxo Esports',
    timeB: 'LOUD',
    data: 'Hoje',
    horario: '19:00',
    oddA: 2.5,
    oddB: 1.5,
    campeonato: 'LBFF - Liga Brasileira de Free Fire',
    ao_vivo: true
  },
  {
    id: 'match-002',
    timeA: 'Vivo Keyd',
    timeB: 'B4 Esports',
    data: 'Hoje',
    horario: '20:30',
    oddA: 1.8,
    oddB: 2.0,
    campeonato: 'LBFF - Liga Brasileira de Free Fire',
    ao_vivo: false
  },
  {
    id: 'match-003',
    timeA: 'Corinthians',
    timeB: 'Los Grandes',
    data: 'Amanhã',
    horario: '18:00',
    oddA: 2.1,
    oddB: 1.7,
    campeonato: 'LBFF - Liga Brasileira de Free Fire',
    ao_vivo: false
  },
  {
    id: 'match-004',
    timeA: 'Team Liquid',
    timeB: 'paiN Gaming',
    data: 'Amanhã',
    horario: '19:30',
    oddA: 1.5,
    oddB: 2.5,
    campeonato: 'LBFF - Liga Brasileira de Free Fire',
    ao_vivo: false
  }
];

interface ApostaSelecionada {
  matchId: string;
  time: 'A' | 'B';
  odd: number;
  nome: string;
}

const ApostasPage: React.FC = () => {
  const [apostas, setApostas] = useState<ApostaSelecionada[]>([]);
  const [valorAposta, setValorAposta] = useState<string>('10');

  const adicionarAposta = (partida: Partida, time: 'A' | 'B') => {
    const novaAposta: ApostaSelecionada = {
      matchId: partida.id,
      time,
      odd: time === 'A' ? partida.oddA : partida.oddB,
      nome: time === 'A' ? partida.timeA : partida.timeB
    };

    // Remove a aposta anterior da mesma partida, se existir
    const apostasFiltradas = apostas.filter(a => a.matchId !== partida.id);
    setApostas([...apostasFiltradas, novaAposta]);
  };

  const removerAposta = (matchId: string) => {
    setApostas(apostas.filter(a => a.matchId !== matchId));
  };

  const calcularRetornoPotencial = (): number => {
    if (apostas.length === 0) return 0;
    
    let multiplicador = 1;
    apostas.forEach(aposta => {
      multiplicador *= aposta.odd;
    });
    
    return parseFloat(valorAposta) * multiplicador;
  };

  return (
    <div className="min-h-screen bg-rpx-dark text-rpx-light">
      <Head>
        <title>Apostas | RPX - Plataforma de Competições e Apostas de Free Fire</title>
        <meta name="description" content="Faça suas apostas em partidas de Free Fire na plataforma RPX" />
      </Head>

      <Header />

      <main className="py-10">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-heading">Apostas</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="mb-8">
                <div className="flex space-x-4">
                  <button className="px-4 py-2 bg-rpx-orange text-white rounded">Todos</button>
                  <button className="px-4 py-2 bg-rpx-blue/30 text-white rounded">LBFF</button>
                  <button className="px-4 py-2 bg-rpx-blue/30 text-white rounded">Copa América</button>
                  <button className="px-4 py-2 bg-rpx-blue/30 text-white rounded">Mundiais</button>
                  <button className="px-4 py-2 bg-rpx-blue/30 text-white rounded">Torneios RPX</button>
                </div>
              </div>
              
              <div className="space-y-4">
                {partidas.map((partida) => (
                  <div key={partida.id} className="bg-rpx-blue/20 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-sm text-rpx-orange mr-2">{partida.campeonato}</span>
                      {partida.ao_vivo && (
                        <span className="flex items-center text-xs bg-red-600 text-white px-2 py-1 rounded">
                          <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                          AO VIVO
                        </span>
                      )}
                      <span className="text-sm ml-auto">{partida.data} - {partida.horario}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-center">
                        <p className="text-lg font-bold mb-2">{partida.timeA}</p>
                        <button 
                          className={`w-full py-2 rounded font-semibold ${
                            apostas.some(a => a.matchId === partida.id && a.time === 'A')
                              ? 'bg-rpx-orange text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                          onClick={() => adicionarAposta(partida, 'A')}
                        >
                          {partida.oddA.toFixed(2)}
                        </button>
                      </div>
                      
                      <div className="mx-4 text-center">
                        <span className="text-xl font-bold">x</span>
                      </div>
                      
                      <div className="flex-1 text-center">
                        <p className="text-lg font-bold mb-2">{partida.timeB}</p>
                        <button 
                          className={`w-full py-2 rounded font-semibold ${
                            apostas.some(a => a.matchId === partida.id && a.time === 'B')
                              ? 'bg-rpx-orange text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white'
                          }`}
                          onClick={() => adicionarAposta(partida, 'B')}
                        >
                          {partida.oddB.toFixed(2)}
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-center">
                      <Link 
                        href={`/apostas/partida/${partida.id}`}
                        className="text-rpx-orange text-sm hover:underline"
                      >
                        Ver mais mercados
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <div className="bg-rpx-blue/20 rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Boletim de Apostas</h2>
                
                {apostas.length === 0 ? (
                  <p className="text-white/70 mb-4">Selecione odds para adicionar ao seu boletim</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {apostas.map((aposta) => (
                      <div key={aposta.matchId} className="flex justify-between items-center bg-white/10 p-3 rounded">
                        <div>
                          <p className="font-semibold">{aposta.nome}</p>
                          <p className="text-sm text-white/70">Vencedor</p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-rpx-orange font-bold mr-2">{aposta.odd.toFixed(2)}</span>
                          <button 
                            className="text-white/70 hover:text-white"
                            onClick={() => removerAposta(aposta.matchId)}
                          >
                            X
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-sm mb-2">Valor da aposta (R$)</label>
                  <input 
                    type="number" 
                    value={valorAposta}
                    onChange={(e) => setValorAposta(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 p-2 rounded text-white"
                    min="5"
                  />
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between">
                    <span>Retorno Potencial:</span>
                    <span className="text-rpx-orange font-bold">
                      R$ {calcularRetornoPotencial().toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <button 
                  className={`w-full py-3 rounded font-bold ${
                    apostas.length > 0 
                      ? 'bg-rpx-orange hover:bg-orange-700 text-white' 
                      : 'bg-gray-600 cursor-not-allowed text-white/50'
                  }`}
                  disabled={apostas.length === 0}
                >
                  Finalizar Aposta
                </button>
                
                <div className="mt-6">
                  <h3 className="font-bold mb-2">Promoções</h3>
                  <div className="bg-rpx-orange/20 p-3 rounded mb-3">
                    <p className="text-sm">Aposte R$50 ou mais e ganhe um Lootbox Básico!</p>
                  </div>
                  <div className="bg-rpx-blue/30 p-3 rounded">
                    <p className="text-sm">Bônus de 10% para apostas múltiplas com 4+ seleções!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ApostasPage; 