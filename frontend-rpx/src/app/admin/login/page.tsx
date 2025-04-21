'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, AlertCircle } from 'react-feather';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAlreadyLoggedIn, setIsAlreadyLoggedIn] = useState(false);

  // Função para redirecionar ao dashboard administrativo
  const redirectToDashboard = () => {
    console.log('Navegando diretamente para o dashboard administrativo');
    // Usar window.location para forçar uma navegação completa, não apenas client-side
    window.location.href = '/admin';
  };

  useEffect(() => {
    // Verificar se já está logado
    const checkLoginStatus = () => {
      try {
        console.log('Verificando status de login no localStorage...');
        const adminStatus = localStorage.getItem('rpx-admin-auth');
        
        if (adminStatus === 'authenticated') {
          console.log('Usuário já autenticado como admin, redirecionando...');
          setIsAlreadyLoggedIn(true);
          // Pequeno atraso para garantir que a UI mostre o estado de redirecionamento
          setTimeout(redirectToDashboard, 500);
        } else {
          console.log('Usuário não autenticado ou sem permissão de admin');
        }
      } catch (error) {
        console.error('Erro ao verificar status de login:', error);
      }
    };

    checkLoginStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    console.log('Iniciando login com:', username);

    try {
      // Autenticação real usando a API
      console.log('Enviando requisição de login para a API...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Resposta de erro da API:', errorData);
        throw new Error(errorData.message || 'Credenciais inválidas');
      }

      const data = await response.json();
      console.log('Resposta de sucesso da API:', data);
      
      // Verificar diferentes estruturas possíveis de token
      let token = null;
      let userInfo = null;
      
      // Verificar estrutura aninhada
      if (data.data?.token) {
        token = data.data.token;
        userInfo = data.data.user;
        console.log('Token encontrado na estrutura data.data.token');
      } 
      // Verificar estrutura direta
      else if (data.token) {
        token = data.token;
        userInfo = data.user;
        console.log('Token encontrado na estrutura data.token');
      }
      
      // Se ainda não encontrou o token, verificar outras possibilidades
      if (!token) {
        console.error('Erro: Token não encontrado na resposta. Estrutura da resposta:', data);
        throw new Error('Token não recebido do servidor');
      }
      
      console.log('Token obtido, armazenando credenciais...');
      
      // Armazenar token
      localStorage.setItem('auth_token', token);
      
      // Também armazenar no cookie para o middleware
      document.cookie = `auth_token=${token}; path=/; max-age=2592000`; // 30 dias
      
      // Verificar se o usuário é admin (verificando tanto roles quanto role)
      const isAdmin = 
        (userInfo?.roles && Array.isArray(userInfo.roles) && (userInfo.roles.includes('admin') || userInfo.roles.includes('superadmin'))) || // Verificar pelo array roles
        userInfo?.role === 'admin' || userInfo?.role === 'superadmin' || // Verificar pelo campo role diretamente
        userInfo?.isAdmin === true; // Verificar pelo campo isAdmin
      
      if (isAdmin) {
        console.log('Usuário confirmado como admin, redirecionando para o dashboard');
        // Armazenar no localStorage
        localStorage.setItem('rpx-admin-auth', 'authenticated');
        
        // Também armazenar no cookie para o middleware
        document.cookie = `rpx-admin-auth=authenticated; path=/; max-age=2592000`; // 30 dias
        
        // Mostrar que estamos logados antes de redirecionar
        setIsAlreadyLoggedIn(true);
        
        // Pequeno atraso para garantir que localStorage e cookies sejam salvos
        setTimeout(redirectToDashboard, 1000);
      } else {
        console.error('Usuário não é admin. Dados do usuário:', userInfo);
        throw new Error('Usuário não tem permissão de administrador');
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao efetuar login. Tente novamente.');
      console.error('Erro no login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Botão para entrar com credenciais demo
  const handleDemoLogin = () => {
    setUsername('master');
    setPassword('Vini200!');
    
    // Submeter o formulário programaticamente após preencher os campos
    const formElement = document.querySelector('form');
    if (formElement) {
      const submitEvent = new Event('submit', { cancelable: true });
      formElement.dispatchEvent(submitEvent);
    }
  };

  // Se já estiver logado, mostrar tela de carregamento por um breve momento
  if (isAlreadyLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto mb-4"></div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Você já está logado</h2>
            <p className="text-gray-600 mb-4">Redirecionando para o painel administrativo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-100 admin-page">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">RPX Admin</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Painel Administrativo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nome de Usuário
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black bg-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ color: 'black', backgroundColor: 'white' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-black bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ color: 'black', backgroundColor: 'white' }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Credenciais de Demo</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 mb-2">Usuário: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">master</span></p>
              <p className="text-xs text-gray-500 mb-4">Senha: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">Vini200!</span></p>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="inline-flex justify-center items-center px-3 py-1.5 border border-transparent rounded text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition"
              >
                Login automático com demo
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            Voltar para o site principal
          </button>
        </div>
      </div>
    </div>
  );
} 