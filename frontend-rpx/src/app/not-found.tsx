'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'react-feather';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-purple-500 mb-4">404</h1>
        
        <h2 className="text-2xl font-semibold mb-6">Página não encontrada</h2>
        
        <p className="text-gray-400 mb-8">
          A página que você está procurando não existe ou foi removida.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
          >
            <ArrowLeft size={18} className="mr-2" />
            Voltar para a página inicial
          </Link>
          
          <div className="pt-2">
            <Link 
              href="/profile" 
              className="text-purple-400 hover:text-purple-300 mx-2"
            >
              Meu Perfil
            </Link>
            <span className="text-gray-600">•</span>
            <Link 
              href="/tournaments" 
              className="text-purple-400 hover:text-purple-300 mx-2"
            >
              Torneios
            </Link>
            <span className="text-gray-600">•</span>
            <Link 
              href="/lobby" 
              className="text-purple-400 hover:text-purple-300 mx-2"
            >
              Lobby
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 