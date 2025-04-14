'use client';

import { useState, useEffect } from 'react';
import { Shield, Award, Star, Info, ArrowRight, ChevronRight } from 'react-feather';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { 
  RankTier, 
  RANK_CONFIG, 
  RANK_FRAMES, 
  calculateRank, 
  calculateRankProgress 
} from '@/utils/ranking';

export default function RankingPage() {
  const { user, isAuthenticated } = useAuth();
  const [userRankPoints, setUserRankPoints] = useState(750); // Pontuação de exemplo (Ouro)
  
  // Calcular o rank atual do usuário
  const userRank = calculateRank(userRankPoints);
  const rankProgress = calculateRankProgress(userRank);
  
  return (
    <div className="bg-background min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Sidebar - Perfil do jogador e seu rank atual */}
          <div className="w-full md:w-72 lg:w-80 space-y-6">
            {/* Card com informações do jogador */}
            <div className="bg-card-bg rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Seu Ranking</h2>
                
                <div className="flex flex-col items-center mb-6">
                  <div className={`w-32 h-32 rounded-full bg-gradient-to-b ${userRank.color} p-1 mb-4`}>
                    <div className="bg-card-bg rounded-full w-full h-full flex items-center justify-center">
                      <img 
                        src={userRank.image} 
                        alt={userRank.name} 
                        className="w-24 h-24 object-contain" 
                      />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold">{userRank.name}</h3>
                  <p className="text-gray-400 text-sm">{userRank.points} pontos</p>
                </div>
                
                {/* Barra de progresso */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Progresso</span>
                    <span className="font-medium">{Math.round(rankProgress.progressPercentage)}%</span>
                  </div>
                  
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${userRank.color}`}
                      style={{ width: `${rankProgress.progressPercentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{userRank.division ? `${userRank.tier.toUpperCase()} ${userRank.division}` : userRank.tier.toUpperCase()}</span>
                    {userRank.tier !== 'challenger' && (
                      <span>
                        {userRank.division === 'I' 
                          ? `${Object.keys(RANK_CONFIG)[Object.keys(RANK_CONFIG).indexOf(userRank.tier) + 1]?.toUpperCase() || ''} IV` 
                          : `${userRank.tier.toUpperCase()} ${
                            userRank.division ? 
                              ['IV', 'III', 'II', 'I'][['IV', 'III', 'II', 'I'].indexOf(userRank.division) + 1] : 
                              ''
                            }`
                        }
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Estatísticas de vitórias */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vitórias</span>
                    <span className="font-medium text-green-500">24</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Derrotas</span>
                    <span className="font-medium text-red-500">12</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate</span>
                    <span className="font-medium text-yellow-500">67%</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-800 p-4">
                <Link 
                  href="/matches"
                  className="flex items-center justify-between text-sm text-white hover:text-primary transition-colors"
                >
                  <span>Jogar partida ranqueada</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
            
            {/* Histórico de partidas */}
            <div className="bg-card-bg rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Últimas Partidas</h2>
                
                <div className="space-y-3">
                  {[
                    { result: 'win', points: '+25', opponent: 'Jogador123', date: '2h atrás' },
                    { result: 'win', points: '+26', opponent: 'GamerPro', date: '3h atrás' },
                    { result: 'loss', points: '-15', opponent: 'RPX_Master', date: '5h atrás' },
                    { result: 'win', points: '+28', opponent: 'Noob_Slayer', date: '1d atrás' },
                  ].map((match, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-card-hover rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          match.result === 'win' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                        }`}>
                          {match.result === 'win' ? 'V' : 'D'}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{match.opponent}</div>
                          <div className="text-xs text-gray-500">{match.date}</div>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        match.result === 'win' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {match.points}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Link 
                    href="/profile/matches"
                    className="text-primary hover:text-primary-hover text-sm flex items-center"
                  >
                    Ver histórico completo
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Conteúdo principal - Sistema de Ranking */}
          <div className="flex-1">
            <div className="bg-card-bg rounded-xl border border-gray-800 overflow-hidden mb-8">
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-2">Sistema de Ranking RPX</h1>
                <p className="text-gray-400 mb-6">
                  Entenda como funciona o sistema de pontuação e ranking da plataforma RPX
                </p>
                
                <div className="space-y-6">
                  <div className="bg-card-hover rounded-lg p-4 border border-gray-700">
                    <h3 className="text-lg font-bold mb-3 flex items-center">
                      <Award size={20} className="text-primary mr-2" />
                      Pontos de Vitória
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Vitória em partida normal</span>
                        <span className="font-medium text-green-500">+20 PV</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Vitória em partida ranqueada</span>
                        <span className="font-medium text-green-500">+25 PV</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Vitória em torneio</span>
                        <span className="font-medium text-green-500">+30 PV</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Bônus por sequência de vitórias</span>
                        <span className="font-medium text-green-500">+2 PV (por vitória, máx. +10)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Bônus por MVP</span>
                        <span className="font-medium text-green-500">+5 PV</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Participação em torneio completo</span>
                        <span className="font-medium text-green-500">+15 PV</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-card-hover rounded-lg p-4 border border-gray-700">
                    <h3 className="text-lg font-bold mb-3 flex items-center">
                      <Shield size={20} className="text-red-500 mr-2" />
                      Pontos de Derrota
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Derrota em partida normal</span>
                        <span className="font-medium text-red-500">-10 PV</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Derrota em partida ranqueada</span>
                        <span className="font-medium text-red-500">-15 PV</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Derrota em torneio</span>
                        <span className="font-medium text-red-500">-10 PV</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-card-hover rounded-lg p-4 border border-gray-700">
                    <h3 className="text-lg font-bold mb-3 flex items-center">
                      <Star size={20} className="text-yellow-500 mr-2" />
                      Divisões e Pontuação Necessária
                    </h3>
                    
                    <div className="space-y-4">
                      {Object.entries(RANK_CONFIG).map(([tier, config]) => {
                        const rank = RANK_FRAMES[tier as RankTier];
                        return (
                          <div key={tier} className="flex items-center">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-b ${rank.color} p-0.5 mr-4`}>
                              <div className="bg-card-bg rounded-full w-full h-full flex items-center justify-center">
                                <img 
                                  src={rank.image} 
                                  alt={rank.name} 
                                  className="w-8 h-8 object-contain" 
                                />
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-bold">{rank.name}</div>
                              {tier !== 'challenger' ? (
                                <div className="text-sm text-gray-400">
                                  {config.min} - {config.max} pontos
                                </div>
                              ) : (
                                <div className="text-sm text-gray-400">
                                  {config.min}+ pontos (Top 100 jogadores)
                                </div>
                              )}
                            </div>
                            
                            {/* Detalhes das divisões para ranks abaixo de Mestre */}
                            {tier !== 'mestre' && tier !== 'challenger' && (
                              <div className="text-sm text-gray-400 grid grid-cols-4 gap-2">
                                {['IV', 'III', 'II', 'I'].map((division, i) => {
                                  const divisionSize = (config.max - config.min) / 4;
                                  const minPoints = Math.round(config.min + (divisionSize * i));
                                  const maxPoints = Math.round(config.min + (divisionSize * (i + 1)) - 1);
                                  return (
                                    <div key={division} className="text-center">
                                      <div className="font-medium">{division}</div>
                                      <div className="text-xs">{minPoints}-{maxPoints}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-card-hover rounded-lg p-4 border border-gray-700">
                    <h3 className="text-lg font-bold mb-3 flex items-center">
                      <Info size={20} className="text-blue-500 mr-2" />
                      Regras Adicionais
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-gray-200 mb-1">Decaimento de Pontos</h4>
                        <p className="text-gray-400 text-sm">
                          Após 15 dias sem jogar partidas ranqueadas, você perderá 5 pontos por dia de inatividade.
                          O decaimento está limitado a uma divisão principal (ex: de Ouro para Prata).
                          Não há decaimento no Bronze.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-gray-200 mb-1">Resets de Temporada</h4>
                        <p className="text-gray-400 text-sm mb-2">
                          A cada 3 meses ocorre um reset parcial, onde você mantém parte dos seus pontos de acordo com seu ranking:
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>Bronze:</span>
                            <span className="font-medium">100%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Prata:</span>
                            <span className="font-medium">80%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ouro:</span>
                            <span className="font-medium">70%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platina:</span>
                            <span className="font-medium">60%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Diamante:</span>
                            <span className="font-medium">50%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mestre:</span>
                            <span className="font-medium">40%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Challenger:</span>
                            <span className="font-medium">30%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-gray-200 mb-1">Partidas de Colocação</h4>
                        <p className="text-gray-400 text-sm mb-2">
                          Novos jogadores devem completar 10 partidas de colocação para receber um ranking inicial:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>0-2 vitórias:</span>
                            <span className="font-medium">Bronze IV</span>
                          </div>
                          <div className="flex justify-between">
                            <span>3-4 vitórias:</span>
                            <span className="font-medium">Bronze II</span>
                          </div>
                          <div className="flex justify-between">
                            <span>5-6 vitórias:</span>
                            <span className="font-medium">Prata IV</span>
                          </div>
                          <div className="flex justify-between">
                            <span>7-8 vitórias:</span>
                            <span className="font-medium">Prata II</span>
                          </div>
                          <div className="flex justify-between">
                            <span>9-10 vitórias:</span>
                            <span className="font-medium">Ouro IV</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Leaderboard */}
            <div className="bg-card-bg rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-6">Top 10 Jogadores</h2>
                
                <div className="overflow-hidden rounded-lg border border-gray-700">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-card-hover">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Posição
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Jogador
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Rank
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Pontos
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Win Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card-bg divide-y divide-gray-700">
                      {[
                        { 
                          position: 1, 
                          name: 'ProPlayer123', 
                          rank: calculateRank(3950), 
                          winRate: '78%'
                        },
                        { 
                          position: 2, 
                          name: 'RPX_Legend', 
                          rank: calculateRank(3850), 
                          winRate: '75%' 
                        },
                        { 
                          position: 3, 
                          name: 'GameMaster', 
                          rank: calculateRank(3750), 
                          winRate: '72%' 
                        },
                        { 
                          position: 4, 
                          name: 'TopGamer', 
                          rank: calculateRank(3650), 
                          winRate: '70%' 
                        },
                        { 
                          position: 5, 
                          name: 'Winner99', 
                          rank: calculateRank(3600), 
                          winRate: '69%' 
                        },
                      ].map((player) => (
                        <tr key={player.position} className="hover:bg-card-hover">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`
                                flex items-center justify-center w-8 h-8 rounded-full
                                ${player.position <= 3 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}
                                font-bold text-sm
                              `}>
                                {player.position}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-purple-800 flex items-center justify-center mr-3">
                                {player.name.charAt(0)}
                              </div>
                              <div className="font-medium">{player.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-b ${player.rank.color} p-0.5 mr-2`}>
                                <div className="bg-card-bg rounded-full w-full h-full flex items-center justify-center">
                                  <img 
                                    src={player.rank.image} 
                                    alt={player.rank.name} 
                                    className="w-5 h-5 object-contain" 
                                  />
                                </div>
                              </div>
                              <span>{player.rank.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">
                            {player.rank.points}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-green-500 font-medium">
                            {player.winRate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 text-center">
                  <Link 
                    href="/ranking/leaderboard"
                    className="text-primary hover:text-primary-hover text-sm inline-flex items-center"
                  >
                    Ver classificação completa
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 