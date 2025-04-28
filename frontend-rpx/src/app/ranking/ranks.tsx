'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'react-feather';
import Image from 'next/image';

export default function RankingsPage() {
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
          <h1 className="text-3xl font-bold">Sistema de Rankings</h1>
        </div>

        <div className="bg-card-bg border border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">Como funcionam os rankings na RPX</h2>
          
          <p className="text-gray-300 mb-6">
            O sistema de rankings da RPX é dividido em dois tipos: <span className="text-purple-400 font-semibold">rankings por posição</span> e <span className="text-blue-400 font-semibold">rankings por pontos</span>. Os jogadores mais ativos e bem-sucedidos podem alcançar os ranks mais altos e ganhar prêmios mensais exclusivos.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-900/20 rounded-xl p-6 border border-purple-700/30">
              <h3 className="text-xl font-bold mb-4 text-purple-300 flex items-center">
                <span className="w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center text-white mr-3">1</span>
                Rankings por Posição
              </h3>
              <p className="text-gray-300 mb-4">
                Os jogadores TOP 100 recebem ranks especiais baseados na sua posição no ranking geral, independentemente dos pontos:
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 relative mr-4">
                    <Image src="/images/ranks/challenger.png" alt="Challenger" width={48} height={48} />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-400">CHALLENGER</h4>
                    <p className="text-sm text-gray-300">TOP 20 jogadores</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 relative mr-4">
                    <Image src="/images/ranks/legend.png" alt="Legend" width={48} height={48} />
                  </div>
                  <div>
                    <h4 className="font-bold text-purple-300">LEGEND</h4>
                    <p className="text-sm text-gray-300">TOP 21 ao TOP 100</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 rounded-xl p-6 border border-blue-700/30">
              <h3 className="text-xl font-bold mb-4 text-blue-300 flex items-center">
                <span className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center text-white mr-3">2</span>
                Rankings por Pontos
              </h3>
              <p className="text-gray-300 mb-4">
                Jogadores abaixo do TOP 100 são classificados pelos pontos acumulados em suas partidas e apostas:
              </p>
              <ul className="space-y-1 text-gray-300">
                <li className="text-sm">• Cada vitória em apostas adiciona pontos</li>
                <li className="text-sm">• Participação em torneios gera pontos extras</li>
                <li className="text-sm">• Desafios semanais completados aumentam pontos</li>
                <li className="text-sm">• Quanto maior o valor da aposta, mais pontos podem ser ganhos</li>
              </ul>
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-4">Tabela Completa de Rankings</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-gray-800">
                  <th className="p-3 text-left">Rank</th>
                  <th className="p-3 text-left">Pontuação</th>
                  <th className="p-3 text-right">Recompensas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr className="bg-purple-900/20">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/challenger.png" alt="Challenger" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-purple-400">CHALLENGER</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">TOP 20</td>
                  <td className="p-3 text-right">
                    <Link href="/ranking/premios" className="text-xs bg-purple-800/50 text-purple-300 px-3 py-1 rounded-full hover:bg-purple-700/50 transition-colors">
                      Prêmios até R$ 16.000
                    </Link>
                  </td>
                </tr>
                
                <tr className="bg-purple-800/20">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/legend.png" alt="Legend" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-purple-300">LEGEND</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">TOP 21 AO TOP 100</td>
                  <td className="p-3 text-right">
                    <Link href="/ranking/premios" className="text-xs bg-purple-800/50 text-purple-300 px-3 py-1 rounded-full hover:bg-purple-700/50 transition-colors">
                      R$ 200 - R$ 1.200
                    </Link>
                  </td>
                </tr>
                
                <tr className="bg-blue-900/20">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/diamond.png" alt="Diamond 3" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-blue-400">DIAMOND 3</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">1400 a 1499 pontos</td>
                  <td className="p-3 text-right">
                    <span className="text-xs bg-blue-800/50 text-blue-300 px-3 py-1 rounded-full">
                      Torneios exclusivos
                    </span>
                  </td>
                </tr>
                
                <tr className="bg-blue-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/diamond.png" alt="Diamond 2" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-blue-400">DIAMOND 2</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">1300 a 1399 pontos</td>
                  <td className="p-3 text-right">
                    <span className="text-xs bg-blue-800/50 text-blue-300 px-3 py-1 rounded-full">
                      Odds melhoradas
                    </span>
                  </td>
                </tr>
                
                <tr className="bg-blue-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/diamond.png" alt="Diamond 1" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-blue-400">DIAMOND 1</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">1200 a 1299 pontos</td>
                  <td className="p-3 text-right">
                    <span className="text-xs bg-blue-800/50 text-blue-300 px-3 py-1 rounded-full">
                      Bônus de depósito
                    </span>
                  </td>
                </tr>
                
                <tr className="bg-cyan-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/platinum.png" alt="Platinum 3" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-cyan-400">PLATINUM 3</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">1100 a 1199 pontos</td>
                  <td className="p-3 text-right">
                    <span className="text-xs text-gray-400">Cashback em apostas</span>
                  </td>
                </tr>
                
                <tr className="bg-cyan-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/platinum.png" alt="Platinum 2" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-cyan-400">PLATINUM 2</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">1000 a 1099 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-cyan-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/platinum.png" alt="Platinum 1" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-cyan-400">PLATINUM 1</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">900 a 999 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-yellow-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/gold.png" alt="Gold 3" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-yellow-400">GOLD 3</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">800 a 899 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-yellow-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/gold.png" alt="Gold 2" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-yellow-400">GOLD 2</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">700 a 799 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-yellow-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/gold.png" alt="Gold 1" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-yellow-400">GOLD 1</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">600 a 699 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-gray-800/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/silver.png" alt="Silver 3" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-gray-400">SILVER 3</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">500 a 599 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-gray-800/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/silver.png" alt="Silver 2" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-gray-400">SILVER 2</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">400 a 499 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-gray-800/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/silver.png" alt="Silver 1" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-gray-400">SILVER 1</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">300 a 399 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-amber-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/bronze.png" alt="Bronze 3" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-amber-600">BRONZE 3</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">200 a 299 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-amber-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/bronze.png" alt="Bronze 2" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-amber-600">BRONZE 2</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">100 a 199 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-amber-900/10">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/bronze.png" alt="Bronze 1" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-amber-600">BRONZE 1</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">1 a 99 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
                
                <tr className="bg-gray-900/40">
                  <td className="p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 relative mr-3">
                        <Image src="/images/ranks/unranked.png" alt="Unranked" width={40} height={40} />
                      </div>
                      <span className="font-semibold text-gray-400">UNRANKED</span>
                    </div>
                  </td>
                  <td className="p-3 text-white">0 pontos</td>
                  <td className="p-3 text-right"></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-lg p-5">
            <h3 className="text-lg font-bold mb-3 text-indigo-300">Como ganhar pontos?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-indigo-900/30 p-4 rounded-lg">
                <h4 className="font-bold text-indigo-200 mb-2">Apostas</h4>
                <p className="text-sm text-gray-300">Apostas vencedoras adicionam pontos baseados no valor apostado e odds.</p>
              </div>
              <div className="bg-indigo-900/30 p-4 rounded-lg">
                <h4 className="font-bold text-indigo-200 mb-2">Torneios</h4>
                <p className="text-sm text-gray-300">Participação em torneios garante pontos, com bônus para colocações altas.</p>
              </div>
              <div className="bg-indigo-900/30 p-4 rounded-lg">
                <h4 className="font-bold text-indigo-200 mb-2">Desafios</h4>
                <p className="text-sm text-gray-300">Complete desafios semanais para ganhar pontos extras no ranking.</p>
              </div>
              <div className="bg-indigo-900/30 p-4 rounded-lg">
                <h4 className="font-bold text-indigo-200 mb-2">Promoções</h4>
                <p className="text-sm text-gray-300">Eventos especiais podem oferecer pontos duplicados ou triplicados.</p>
              </div>
            </div>
          </div>
        </div>
        
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