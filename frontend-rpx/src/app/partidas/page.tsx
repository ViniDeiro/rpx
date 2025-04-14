'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Key, Users, DollarSign, AlertTriangle } from 'react-feather';

export default function MatchesPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminMessage, setShowAdminMessage] = useState(false);
  
  useEffect(() => {
    // Verificar se o usuário é administrador
    const checkAdmin = () => {
      try {
        const adminStatus = localStorage.getItem('rpx-admin-auth');
        setIsAdmin(adminStatus === 'authenticated');
      } catch (error) {
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, []);
  
  const handleCreateMatch = () => {
    if (isAdmin) {
      router.push('/admin/partidas/criar');
    } else {
      setShowAdminMessage(true);
      setTimeout(() => {
        setShowAdminMessage(false);
      }, 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Desafios Privados</h1>
        <p className="text-gray-600 max-w-3xl">
          As partidas personalizadas são exclusivas e acessíveis apenas por senha. Somente administradores podem criar partidas privadas para torneios e eventos especiais.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Shield size={28} className="text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Desafios Restritos</h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Estas são partidas especiais criadas por administradores e protegidas por senha. São utilizadas para torneios oficiais, eventos privados e competições exclusivas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Key size={20} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso por Senha</h3>
            <p className="text-gray-600 text-sm">
              Apenas jogadores com senha podem entrar nestas partidas privadas.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={20} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Limite de Jogadores</h3>
            <p className="text-gray-600 text-sm">
              Desafios com número específico de participantes para competições balanceadas.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Premiação Exclusiva</h3>
            <p className="text-gray-600 text-sm">
              Recompensas especiais para partidas oficiais e torneios exclusivos.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleCreateMatch}
            className={`px-6 py-3 rounded-lg font-semibold 
              ${isAdmin
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
          >
            {isAdmin ? 'Criar Nova Partida' : 'Área Restrita a Administradores'}
          </button>
          
          {showAdminMessage && (
            <div className="mt-4 text-red-500 flex items-center justify-center">
              <AlertTriangle size={16} className="mr-1" />
              <span>Apenas administradores podem criar partidas</span>
            </div>
          )}
          
          {!isAdmin && (
            <p className="mt-4 text-sm text-gray-500">
              Para criar partidas, você precisa ter privilégios de administrador.
              <br />
              <Link href="/lobby" className="text-purple-600 hover:underline mt-1 inline-block">
                Ir para o Lobby de Desafios Públicos
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 