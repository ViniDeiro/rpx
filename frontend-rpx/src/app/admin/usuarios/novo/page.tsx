'use client';

import React from 'react';
import Link from 'next/link';

export default function NovoAdministrador() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Novo Administrador</h1>
        <p className="text-gray-500">Crie um novo usuário com permissões administrativas</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-center text-gray-700 mb-4">
          Versão simplificada para teste
        </p>
        
        <div className="flex justify-center">
          <Link href="/admin/usuarios" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700">
            Voltar para lista de usuários
          </Link>
        </div>
      </div>
    </div>
  );
} 