import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import EditarProdutoForm from '@/components/admin/EditarProdutoForm';

export const metadata: Metadata = {
  title: 'Editar Produto - RPX Admin',
  description: 'Área de administração para editar produtos da loja',
};

export default function EditarProdutoPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Editar Produto</h1>
        <Link 
          href="/admin/loja"
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-800 transition-colors"
        >
          Voltar para Lista
        </Link>
      </div>
      
      <EditarProdutoForm id={id} />
    </div>
  );
} 