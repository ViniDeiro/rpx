"use client";

import React from 'react';
import Link from 'next/link';
import LojaGrid from '@/components/loja/LojaGrid';

export default function LojaPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Loja RPX</h1>
        <p className="text-gray-600">Confira os produtos disponíveis em nossa loja</p>
      </div>
      
      <LojaGrid />
    </div>
  );
} 