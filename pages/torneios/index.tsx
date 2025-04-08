import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface Torneio {
  id: string;
  nome: string;
  data: string;
  horario: string;
  premio: string;
  vagas: number;
  participantes: number;
  status: 'aberto' | 'fechado' | 'em_andamento' | 'finalizado';
}

const torneios: Torneio[] = [
  {
    id: 'daily-cup',
    nome: 'RPX Daily Cup',
    data: 'Hoje',
    horario: '20:00',
    premio: 'R$1.000,00',
    vagas: 100,
    participantes: 75,
    status: 'aberto'
  },
  {
    id: 'pro-league',
    nome: 'RPX Pro League',
    data: 'Sábado',
    horario: '15:00',
    premio: 'R$5.000,00',
    vagas: 50,
    participantes: 30,
    status: 'aberto'
  },
  {
    id: 'campeonato-mensal',
    nome: 'Campeonato Mensal RPX',
    data: 'Domingo',
    horario: '18:00',
    premio: 'R$10.000,00',
    vagas: 200,
    participantes: 110,
    status: 'aberto'
  },
  {
    id: 'torneio-iniciantes',
    nome: 'Torneio para Iniciantes',
    data: 'Sexta-feira',
    horario: '19:00',
    premio: 'R$500,00',
    vagas: 150,
    participantes: 30,
    status: 'aberto'
  }
];

const TorneiosPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-rpx-dark text-rpx-light">
      <Head>
        <title>Torneios | RPX - Plataforma de Competições e Apostas de Free Fire</title>
        <meta name="description" content="Participe dos melhores torneios de Free Fire na plataforma RPX" />
      </Head>

      <Header />

      <main className="py-10">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-heading">Torneios Disponíveis</h1>
          
          <div className="mb-8">
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-rpx-orange text-white rounded">Todos</button>
              <button className="px-4 py-2 bg-rpx-blue/30 text-white rounded">Diários</button>
              <button className="px-4 py-2 bg-rpx-blue/30 text-white rounded">Semanais</button>
              <button className="px-4 py-2 bg-rpx-blue/30 text-white rounded">Mensais</button>
              <button className="px-4 py-2 bg-rpx-blue/30 text-white rounded">Especiais</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {torneios.map((torneio) => (
              <div key={torneio.id} className="bg-rpx-blue/20 rounded-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold">{torneio.nome}</h2>
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full uppercase">
                      {torneio.status === 'aberto' ? 'Aberto' : 
                       torneio.status === 'em_andamento' ? 'Em andamento' : 
                       torneio.status === 'fechado' ? 'Fechado' : 'Finalizado'}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-rpx-orange">{torneio.data} às {torneio.horario}</p>
                    <p className="text-xl font-bold mb-2">Premiação: {torneio.premio}</p>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div 
                        className="bg-rpx-orange rounded-full h-4" 
                        style={{ width: `${(torneio.participantes / torneio.vagas) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1">{torneio.participantes}/{torneio.vagas} participantes</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link 
                      href={`/torneios/${torneio.id}`}
                      className="flex-1 px-4 py-2 bg-rpx-blue text-white rounded text-center"
                    >
                      Detalhes
                    </Link>
                    <Link 
                      href={`/torneios/${torneio.id}/inscricao`}
                      className="flex-1 px-4 py-2 bg-rpx-orange text-white rounded text-center"
                    >
                      Inscrever-se
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6 font-heading">Torneios Passados</h2>
            <div className="bg-rpx-blue/20 rounded-lg p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="py-3 text-left">Torneio</th>
                      <th className="py-3 text-left">Data</th>
                      <th className="py-3 text-left">Prêmio</th>
                      <th className="py-3 text-left">Vencedor</th>
                      <th className="py-3 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/10">
                      <td className="py-3">RPX Weekly Cup</td>
                      <td className="py-3">10/10/2023</td>
                      <td className="py-3">R$3.000,00</td>
                      <td className="py-3">FenixGamer</td>
                      <td className="py-3">
                        <Link href="/torneios/weekly-cup/resultados" className="text-rpx-orange">
                          Ver resultados
                        </Link>
                      </td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-3">Copa Iniciantes</td>
                      <td className="py-3">05/10/2023</td>
                      <td className="py-3">R$500,00</td>
                      <td className="py-3">NovaEstrela</td>
                      <td className="py-3">
                        <Link href="/torneios/copa-iniciantes/resultados" className="text-rpx-orange">
                          Ver resultados
                        </Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3">Campeonato Regional</td>
                      <td className="py-3">01/10/2023</td>
                      <td className="py-3">R$8.000,00</td>
                      <td className="py-3">EliteSquad</td>
                      <td className="py-3">
                        <Link href="/torneios/campeonato-regional/resultados" className="text-rpx-orange">
                          Ver resultados
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TorneiosPage; 