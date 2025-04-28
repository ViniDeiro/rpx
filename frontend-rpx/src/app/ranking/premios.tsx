'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, DollarSign, TrendingUp, Users } from 'react-feather';

export default function RankingPrizesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center">
          <Link 
            href="/ranking" 
            className="flex items-center text-gray-400 hover:text-white transition-colors mr-4"
          >
            <ArrowLeft size={18} className="mr-1" />
            <span>Voltar ao Ranking</span>
          </Link>
          <h1 className="text-3xl font-bold">Premiações do Ranking Mensal</h1>
        </div>

        {/* Informações sobre premiações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-card-bg border border-gray-700 rounded-xl p-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
              <TrendingUp size={24} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Top 20: Challenger</h3>
            <p className="text-center text-gray-300 mb-2">
              Os 20 melhores jogadores do mês recebem o rank Challenger e prêmios especiais
            </p>
            <div className="mt-2 bg-purple-900/20 text-purple-400 px-3 py-1 rounded-full text-sm">
              Premiação de até R$ 16.000
            </div>
          </div>

          <div className="bg-card-bg border border-gray-700 rounded-xl p-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-indigo-900/30 flex items-center justify-center mb-4">
              <Users size={24} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Top 21-100: Legend</h3>
            <p className="text-center text-gray-300 mb-2">
              Jogadores entre 21ª e 100ª posição recebem o rank Legend e recompensas exclusivas
            </p>
            <div className="mt-2 bg-indigo-900/20 text-indigo-400 px-3 py-1 rounded-full text-sm">
              Premiações entre R$ 200 e R$ 1.200
            </div>
          </div>

          <div className="bg-card-bg border border-gray-700 rounded-xl p-6 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-amber-900/30 flex items-center justify-center mb-4">
              <DollarSign size={24} className="text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Premiação Total</h3>
            <p className="text-center text-gray-300 mb-2">
              Mais de R$ 100.000 em prêmios são distribuídos mensalmente para os 100 melhores jogadores
            </p>
            <div className="mt-2 bg-amber-900/20 text-amber-400 px-3 py-1 rounded-full text-sm">
              + de R$ 100.000/mês em prêmios
            </div>
          </div>
        </div>

        {/* Tabela de premiações */}
        <div className="bg-card-bg border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Award className="text-amber-400 mr-2" size={24} />
            Tabela Completa de Premiações
          </h2>
          
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Top 3 - Destaque especial */}
              <div className="bg-gradient-to-br from-amber-900/20 to-amber-900/10 rounded-xl p-5 border border-amber-800/30">
                <h3 className="text-xl font-bold mb-4 text-amber-300">Top 3 - Campeões do Mês</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-amber-500 text-black font-bold w-8 h-8 rounded-full flex items-center justify-center mr-3">1</div>
                      <span className="font-semibold">1º lugar</span>
                    </div>
                    <div className="text-amber-300 font-bold">R$ 16.000</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-gray-300 text-black font-bold w-8 h-8 rounded-full flex items-center justify-center mr-3">2</div>
                      <span className="font-semibold">2º lugar</span>
                    </div>
                    <div className="text-amber-300 font-bold">R$ 11.000</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center">
                      <div className="bg-amber-700 text-black font-bold w-8 h-8 rounded-full flex items-center justify-center mr-3">3</div>
                      <span className="font-semibold">3º lugar</span>
                    </div>
                    <div className="text-amber-300 font-bold">R$ 8.000</div>
                  </div>
                </div>
              </div>
              
              {/* Top 4-10 */}
              <div className="bg-gradient-to-br from-indigo-900/20 to-indigo-900/10 rounded-xl p-5 border border-indigo-800/30">
                <h3 className="text-xl font-bold mb-4 text-indigo-300">Top 4 a 10</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                    <span>4º lugar</span>
                    <div className="text-indigo-300 font-bold">R$ 5.000</div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                    <span>5º lugar</span>
                    <div className="text-indigo-300 font-bold">R$ 4.800</div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                    <span>6º lugar</span>
                    <div className="text-indigo-300 font-bold">R$ 4.400</div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                    <span>7º lugar</span>
                    <div className="text-indigo-300 font-bold">R$ 4.000</div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                    <span>8º lugar</span>
                    <div className="text-indigo-300 font-bold">R$ 3.600</div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                    <span>9º lugar</span>
                    <div className="text-indigo-300 font-bold">R$ 3.200</div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
                    <span>10º lugar</span>
                    <div className="text-indigo-300 font-bold">R$ 3.000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela principal de premiações */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-3 text-left">Colocação</th>
                  <th className="p-3 text-right">Premiação (R$)</th>
                  <th className="p-3 text-left">Ranking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {/* Top 11-40 - Premiações individuais */}
                <tr className="border-b border-gray-700 bg-purple-900/10">
                  <td colSpan={3} className="p-3 font-semibold text-purple-300">Top 11 ao 20 - Challenger</td>
                </tr>
                <tr>
                  <td className="p-3">11º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 2.400</td>
                  <td className="p-3 text-purple-400">Challenger</td>
                </tr>
                <tr>
                  <td className="p-3">12º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 2.200</td>
                  <td className="p-3 text-purple-400">Challenger</td>
                </tr>
                <tr>
                  <td className="p-3">13º-14º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 2.000</td>
                  <td className="p-3 text-purple-400">Challenger</td>
                </tr>
                <tr>
                  <td className="p-3">15º-16º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 1.800</td>
                  <td className="p-3 text-purple-400">Challenger</td>
                </tr>
                <tr>
                  <td className="p-3">17º-18º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 1.600</td>
                  <td className="p-3 text-purple-400">Challenger</td>
                </tr>
                <tr>
                  <td className="p-3">19º-20º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 1.400</td>
                  <td className="p-3 text-purple-400">Challenger</td>
                </tr>
                
                {/* Top 21-40 - Legend (premiações graduais) */}
                <tr className="border-b border-gray-700 bg-indigo-900/10">
                  <td colSpan={3} className="p-3 font-semibold text-indigo-300">Top 21 ao 40 - Legend</td>
                </tr>
                <tr>
                  <td className="p-3">21º-25º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 1.200</td>
                  <td className="p-3 text-indigo-400">Legend</td>
                </tr>
                <tr>
                  <td className="p-3">26º-30º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 1.000</td>
                  <td className="p-3 text-indigo-400">Legend</td>
                </tr>
                <tr>
                  <td className="p-3">31º-40º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 800</td>
                  <td className="p-3 text-indigo-400">Legend</td>
                </tr>
                
                {/* Top 41-100 - Legend (premiação fixa) */}
                <tr className="border-b border-gray-700 bg-indigo-900/10">
                  <td colSpan={3} className="p-3 font-semibold text-indigo-300">Top 41 ao 100 - Legend</td>
                </tr>
                <tr>
                  <td className="p-3">41º-60º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 500</td>
                  <td className="p-3 text-indigo-400">Legend</td>
                </tr>
                <tr>
                  <td className="p-3">61º-80º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 300</td>
                  <td className="p-3 text-indigo-400">Legend</td>
                </tr>
                <tr>
                  <td className="p-3">81º-100º lugar</td>
                  <td className="p-3 text-right font-medium">R$ 200</td>
                  <td className="p-3 text-indigo-400">Legend</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 p-4 bg-amber-900/10 border border-amber-900/20 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-amber-300">Nota importante:</span> Os valores apresentados são dobrados em relação à tabela base de premiações. 
                  O pagamento dos prêmios é realizado até o 5º dia útil do mês seguinte, diretamente na conta RPX dos jogadores.
                  Para sacar o prêmio, o jogador deve ter realizado pelo menos 20 apostas durante o mês.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call to action */}
        <div className="text-center">
          <Link 
            href="/ranking" 
            className="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-8 py-3 rounded-lg font-semibold transition-all"
          >
            Voltar para o Ranking
            <ArrowLeft size={18} className="ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
} 