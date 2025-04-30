'use client';

import React from 'react';
import { ArrowLeft, Trophy, Award, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function RankingPremiosPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="mb-6">
        <Link 
          href="/ranking"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Voltar ao ranking</span>
        </Link>
      </div>
      
      <h1 className="text-4xl font-bold mb-8 flex items-center">
        <Trophy size={32} className="text-amber-400 mr-3" />
        Tabela Completa de Premiações
      </h1>
      
      <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card-bg border border-gray-700 rounded-xl p-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-amber-900/30 flex items-center justify-center mb-4">
            <Trophy size={24} className="text-amber-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Sistema de Premiação</h3>
          <p className="text-center text-gray-300 mb-2">
            Prêmios distribuídos mensalmente para os 100 melhores jogadores do ranking
          </p>
          <div className="mt-2 bg-amber-900/20 text-amber-400 px-3 py-1 rounded-full text-sm">
            Premiação todo dia 05
          </div>
        </div>
        
        <div className="bg-card-bg border border-gray-700 rounded-xl p-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-purple-900/30 flex items-center justify-center mb-4">
            <Award size={24} className="text-purple-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Como Participar</h3>
          <p className="text-center text-gray-300 mb-2">
            Participe de partidas ranqueadas e suba no ranking para garantir sua premiação mensal
          </p>
          <div className="mt-2 bg-purple-900/20 text-purple-400 px-3 py-1 rounded-full text-sm">
            Mínimo de 50 partidas no mês
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
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Award className="text-amber-400 mr-2" size={24} />
          Top 3 - Pódio de Campeões
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-amber-900/30 to-amber-900/10 rounded-xl p-6 border border-amber-700/30 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-500/20 rounded-full blur-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-amber-500 text-black font-bold w-16 h-16 rounded-full flex items-center justify-center text-xl">1</div>
              </div>
              <h3 className="text-center text-2xl font-bold mb-2 text-amber-300">1º Lugar</h3>
              <div className="bg-black/30 rounded-lg p-4 text-center mb-3">
                <p className="text-3xl font-bold text-amber-300">R$ 16.000</p>
              </div>
              <div className="text-sm text-gray-300 text-center">
                + Troféu de Campeão do Mês<br />
                + 5.000 Pontos de RPX
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-zinc-800/30 to-zinc-900/10 rounded-xl p-6 border border-zinc-700/30 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-zinc-500/20 rounded-full blur-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-zinc-400 text-black font-bold w-16 h-16 rounded-full flex items-center justify-center text-xl">2</div>
              </div>
              <h3 className="text-center text-2xl font-bold mb-2 text-zinc-300">2º Lugar</h3>
              <div className="bg-black/30 rounded-lg p-4 text-center mb-3">
                <p className="text-3xl font-bold text-zinc-300">R$ 11.000</p>
              </div>
              <div className="text-sm text-gray-300 text-center">
                + Medalha de Prata<br />
                + 3.000 Pontos de RPX
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-800/20 to-amber-900/10 rounded-xl p-6 border border-amber-800/20 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-700/10 rounded-full blur-xl"></div>
            <div className="relative">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-amber-700 text-black font-bold w-16 h-16 rounded-full flex items-center justify-center text-xl">3</div>
              </div>
              <h3 className="text-center text-2xl font-bold mb-2 text-amber-700">3º Lugar</h3>
              <div className="bg-black/30 rounded-lg p-4 text-center mb-3">
                <p className="text-3xl font-bold text-amber-700">R$ 8.000</p>
              </div>
              <div className="text-sm text-gray-300 text-center">
                + Medalha de Bronze<br />
                + 2.000 Pontos de RPX
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabela principal de premiações */}
      <div className="bg-card-bg border border-gray-700 rounded-xl overflow-hidden mb-12">
        <div className="p-4 border-b border-gray-700 bg-gradient-to-r from-purple-900/20 to-transparent">
          <h3 className="font-bold">Premiações Detalhadas (Top 4-100)</h3>
        </div>
        
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
              {/* Top 4-10 */}
              <tr className="border-b border-gray-700 bg-blue-900/10">
                <td colSpan={3} className="p-3 font-semibold text-blue-300">Top 4 ao 10 - Master</td>
              </tr>
              <tr>
                <td className="p-3">4º lugar</td>
                <td className="p-3 text-right font-medium">R$ 5.000</td>
                <td className="p-3 text-blue-400">Master</td>
              </tr>
              <tr>
                <td className="p-3">5º lugar</td>
                <td className="p-3 text-right font-medium">R$ 4.800</td>
                <td className="p-3 text-blue-400">Master</td>
              </tr>
              <tr>
                <td className="p-3">6º lugar</td>
                <td className="p-3 text-right font-medium">R$ 4.400</td>
                <td className="p-3 text-blue-400">Master</td>
              </tr>
              <tr>
                <td className="p-3">7º lugar</td>
                <td className="p-3 text-right font-medium">R$ 4.000</td>
                <td className="p-3 text-blue-400">Master</td>
              </tr>
              <tr>
                <td className="p-3">8º lugar</td>
                <td className="p-3 text-right font-medium">R$ 3.600</td>
                <td className="p-3 text-blue-400">Master</td>
              </tr>
              <tr>
                <td className="p-3">9º lugar</td>
                <td className="p-3 text-right font-medium">R$ 3.200</td>
                <td className="p-3 text-blue-400">Master</td>
              </tr>
              <tr>
                <td className="p-3">10º lugar</td>
                <td className="p-3 text-right font-medium">R$ 3.000</td>
                <td className="p-3 text-blue-400">Master</td>
              </tr>
              
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
              <tr className="border-b border-gray-700 bg-cyan-900/10">
                <td colSpan={3} className="p-3 font-semibold text-cyan-300">Top 41 ao 100 - Diamond</td>
              </tr>
              <tr>
                <td className="p-3">41º-60º lugar</td>
                <td className="p-3 text-right font-medium">R$ 500</td>
                <td className="p-3 text-cyan-400">Diamond</td>
              </tr>
              <tr>
                <td className="p-3">61º-80º lugar</td>
                <td className="p-3 text-right font-medium">R$ 350</td>
                <td className="p-3 text-cyan-400">Diamond</td>
              </tr>
              <tr>
                <td className="p-3">81º-100º lugar</td>
                <td className="p-3 text-right font-medium">R$ 200</td>
                <td className="p-3 text-cyan-400">Diamond</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Observações */}
      <div className="bg-card-bg border border-gray-700 rounded-xl p-6">
        <h3 className="font-bold text-lg mb-4">Observações sobre Premiações</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">•</span>
            <span>As premiações são distribuídas até o 5º dia útil do mês seguinte.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">•</span>
            <span>Para ser elegível à premiação, o jogador deve ter completado ao menos 50 partidas no mês.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">•</span>
            <span>Os valores são creditados automaticamente na carteira digital do usuário.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">•</span>
            <span>Valores iguais ou superiores a R$ 5.000 podem requerer documentação adicional para retirada.</span>
          </li>
          <li className="flex items-start">
            <span className="text-amber-500 mr-2">•</span>
            <span>Em caso de empate em pontos, o critério de desempate será o número de vitórias.</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 