'use client';

import React from 'react';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import Link from 'next/link';
import { RankTier } from '@/utils/ranking';

const ranks: RankTier[] = [
  'unranked', 
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond',
  'legend',
  'challenger'
];

const FramesTestPage = () => {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Teste de Frames</h1>
        <p className="text-gray-400">Esta página exibe todos os frames disponíveis para verificação visual.</p>
        <Link href="/" className="text-blue-500 hover:underline mt-2 inline-block">
          Voltar para Home
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {ranks.map((rank) => (
          <div key={rank} className="flex flex-col items-center">
            <ProfileAvatar size="lg" rankTier={rank} />
            <p className="mt-4 text-center font-medium capitalize">{rank}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FramesTestPage; 