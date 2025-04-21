'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
  const router = useRouter();
  const [dbData, setDbData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Buscar informações do banco de dados
        console.log('Buscando informações do banco...');
        const dbResponse = await fetch('/api/admin/check-db');
        
        if (!dbResponse.ok) {
          throw new Error(`Erro ao verificar banco: ${dbResponse.status} ${dbResponse.statusText}`);
        }
        
        const dbInfo = await dbResponse.json();
        setDbData(dbInfo);
        console.log('Informações do banco recebidas:', dbInfo);
        
        // Buscar usuários da API
        console.log('Buscando usuários da API...');
        const usersResponse = await fetch('/api/admin/users', {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          credentials: 'include'
        });
        
        if (!usersResponse.ok) {
          throw new Error(`Erro ao buscar usuários: ${usersResponse.status} ${usersResponse.statusText}`);
        }
        
        const usersInfo = await usersResponse.json();
        setUsersData(usersInfo);
        console.log('Usuários recebidos:', usersInfo);
        
      } catch (err: any) {
        console.error('Erro ao buscar dados de diagnóstico:', err);
        setError(err.message || 'Erro desconhecido ao buscar dados');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  const addTestUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/setup-test-users');
      
      if (!response.ok) {
        throw new Error(`Erro ao adicionar usuários de teste: ${response.status}`);
      }
      
      const result = await response.json();
      alert(`Usuários de teste adicionados: ${result.message}`);
      
      // Recarregar dados
      window.location.reload();
    } catch (err: any) {
      console.error('Erro ao adicionar usuários de teste:', err);
      alert(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const useEmergencyUsers = async () => {
    try {
      setIsLoading(true);
      
      // Usar a rota de emergência
      const response = await fetch('/api/admin/force-users', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar usuários de emergência: ${response.status}`);
      }
      
      const emergencyUsers = await response.json();
      
      // Verificar se temos usuários
      if (!Array.isArray(emergencyUsers) || emergencyUsers.length === 0) {
        alert('Nenhum usuário encontrado pela rota de emergência.');
        return;
      }
      
      alert(`Encontrados ${emergencyUsers.length} usuários pela rota de emergência!`);
      
      // Atualizar a interface de admin para usar esses usuários
      const setUsersUrl = `/api/admin/set-users?count=${emergencyUsers.length}`;
      
      const setResponse = await fetch(setUsersUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ users: emergencyUsers })
      });
      
      if (!setResponse.ok) {
        throw new Error('Falha ao configurar usuários de emergência');
      }
      
      // Recarregar a página
      window.location.href = '/admin/usuarios';
      
    } catch (err: any) {
      console.error('Erro ao usar rota de emergência:', err);
      alert(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico da Aplicação</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Ações</h2>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/admin')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
            >
              Voltar para Dashboard
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Atualizar Diagnóstico
            </button>
            
            <button 
              onClick={addTestUsers}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
            >
              Adicionar Usuários de Teste
            </button>
            
            <button 
              onClick={useEmergencyUsers}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded"
            >
              Usar Rota de Emergência
            </button>
            
            <button 
              onClick={() => router.push('/admin/usuarios')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded"
            >
              Verificar Página de Usuários
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Erro</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Estado do Banco:</span> {dbData?.status || 'Desconhecido'}
              </p>
              <p>
                <span className="font-semibold">Tempo de Conexão:</span> {dbData?.connectionTime || 'N/A'}
              </p>
              <p>
                <span className="font-semibold">Usuários no Banco:</span> {dbData?.database?.userCount || 0}
              </p>
              <p>
                <span className="font-semibold">Usuários na API:</span> {Array.isArray(usersData) ? usersData.length : 'Não é um array'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Detalhes do Banco de Dados</h2>
          {dbData ? (
            <div>
              <h3 className="font-medium mb-2">Coleções ({dbData.database?.collections?.length || 0}):</h3>
              <ul className="list-disc pl-5 mb-4">
                {dbData.database?.collections?.map((col: string, index: number) => (
                  <li key={index}>{col}</li>
                ))}
              </ul>
              
              <h3 className="font-medium mb-2">Amostra de Usuários:</h3>
              {dbData.database?.sampleUsers?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">ID</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">Nome</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">Email</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbData.database.sampleUsers.map((user: any, index: number) => (
                        <tr key={index}>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{user.id.substring(0, 8)}...</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{user.name || 'N/A'}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{user.email || 'N/A'}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{user.isAdmin ? 'Sim' : 'Não'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Nenhum usuário encontrado na amostra.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Carregando informações do banco de dados...</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Resposta da API de Usuários</h2>
          {usersData ? (
            <div>
              <p className="mb-2">
                <span className="font-semibold">Tipo de Resposta:</span> {Array.isArray(usersData) ? 'Array' : typeof usersData}
              </p>
              <p className="mb-4">
                <span className="font-semibold">Tamanho:</span> {Array.isArray(usersData) ? usersData.length : 'N/A'}
              </p>
              
              {Array.isArray(usersData) && usersData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">ID</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">Nome</th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersData.slice(0, 5).map((user: any, index: number) => (
                        <tr key={index}>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{user._id?.substring(0, 8) || 'N/A'}...</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{user.name || user.username || 'N/A'}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-sm">{user.email || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {usersData.length > 5 && (
                    <p className="mt-2 text-gray-500 text-sm">Mostrando 5 de {usersData.length} usuários.</p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                  <p className="font-bold">Aviso</p>
                  <p>A API não retornou nenhum usuário.</p>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Dados brutos:</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(usersData, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Carregando dados da API...</p>
          )}
        </div>
      </div>
    </div>
  );
} 