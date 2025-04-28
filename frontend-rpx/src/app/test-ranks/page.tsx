'use client';

import { useState } from 'react';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { RankTier } from '@/utils/ranking';

export default function TestRanksPage() {
  const rankTiers: RankTier[] = [
    'unranked', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend', 'challenger'
  ];
  
  const [selectedRank, setSelectedRank] = useState<RankTier>('unranked');
  
  return (
    <div className="min-h-screen bg-[#0D0A2A] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Teste de Frames de Rank</h1>
        
        <div className="bg-[#171335] rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Selecionar Rank</h2>
          
          <div className="flex flex-wrap gap-2 mb-8">
            {rankTiers.map(rank => (
              <button
                key={rank}
                onClick={() => setSelectedRank(rank)}
                className={`px-4 py-2 rounded-lg ${
                  selectedRank === rank 
                    ? 'bg-[#8860FF] text-white' 
                    : 'bg-[#232048] text-gray-300 hover:bg-[#3D2A85]'
                } transition-colors`}
              >
                {rank.charAt(0).toUpperCase() + rank.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4">
              Rank atual: <span className="text-[#8860FF]">{selectedRank.charAt(0).toUpperCase() + selectedRank.slice(1)}</span>
            </h3>
            
            <div className="relative">
              <ProfileAvatar size="lg" rankTier={selectedRank} />
            </div>
          </div>
        </div>
        
        <div className="bg-[#171335] rounded-xl p-6 shadow-lg">
          <h2 className="text-xl font-bold mb-6">Todos os Frames</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {rankTiers.map(rank => (
              <div key={rank} className="flex flex-col items-center">
                <div className="mb-2">
                  <ProfileAvatar size="md" rankTier={rank} />
                </div>
                <span className="text-sm font-medium">{rank.charAt(0).toUpperCase() + rank.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 