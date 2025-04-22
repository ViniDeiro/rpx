import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import NovoProdutoForm from '@/components/admin/NovoProdutoForm';

export const metadata: Metadata = {
  title: 'Novo Produto - RPX Admin',
  description: 'Área de administração para adicionar novos produtos à loja',
};

export default function NovoProdutoPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Adicionar Novo Produto</h1>
        <Link 
          href="/admin/loja"
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-800 transition-colors"
        >
          Voltar para Lista
        </Link>
      </div>
      
      <NovoProdutoForm />
    </div>
  );
} 