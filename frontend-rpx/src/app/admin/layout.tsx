'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart2, Users, Activity, DollarSign, Package, Settings, 
  LogOut, Home, Menu, X, ChevronRight, CheckSquare 
} from 'react-feather';

// Comentário sobre o layout admin
// Não precisamos mais exportar metadata aqui pois o RootLayout já
// está configurado para não aplicar o Layout principal nas páginas de admin

// Esta função seria substituída por sua lógica de autenticação real
const useAdminAuth = () => {
  // Verificação real de autenticação admin
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificação real usando o token JWT
    const checkAdmin = async () => {
      try {
        // Verificar se existe um token no localStorage
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          console.log('Token não encontrado, redirecionando para login');
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        // Validar o token e verificar se o usuário é admin
        try {
          // Fazer uma requisição para verificar o perfil do usuário
          const response = await fetch('/api/users/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.error('Erro na resposta da API:', response.status);
            setIsAdmin(false);
            return;
          }

          const data = await response.json();
          
          // Verificar se o usuário tem o papel de administrador
          const userData = data.data?.user || data.user;
          
          if (userData && userData.roles && userData.roles.includes('admin')) {
            console.log('Usuário autenticado como admin');
            setIsAdmin(true);
            // Também armazenar na localStorage para evitar muitas requisições
            localStorage.setItem('rpx-admin-auth', 'authenticated');
          } else {
            console.log('Usuário não tem permissão de admin');
            setIsAdmin(false);
          }
        } catch (error) {
          console.error('Erro ao validar token:', error);
          localStorage.removeItem('rpx-admin-auth');
          setIsAdmin(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, []);

  return { isAdmin, isLoading };
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathnameRaw = usePathname();
  const pathname = pathnameRaw || '/admin';
  const { isAdmin, isLoading } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Redireciona para login se não for admin
    if (!isLoading && isAdmin === false) {
      router.push('/admin/login');
    }
  }, [isAdmin, isLoading, router]);

  // Renderiza tela de carregamento enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-800 border-r-transparent"></div>
          <p className="mt-4 text-lg text-gray-800">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  // Se estiver na página de login e não estiver autenticado, renderiza apenas o conteúdo
  if (pathname === '/admin/login' && !isAdmin) {
    return <>{children}</>;
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <BarChart2 size={20} /> },
    { path: '/admin/usuarios', label: 'Usuários', icon: <Users size={20} /> },
    { path: '/admin/partidas', label: 'Partidas', icon: <Activity size={20} /> },
    { path: '/admin/verificacao', label: 'Verificação', icon: <CheckSquare size={20} /> },
    { path: '/admin/financeiro', label: 'Financeiro', icon: <DollarSign size={20} /> },
    { path: '/admin/personagens', label: 'Personagens', icon: <Package size={20} /> },
    { path: '/admin/configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
  ];

  // Se for admin ou a verificação ainda não terminou, renderiza o layout completo
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar para desktop */}
      <div className={`bg-white shadow-lg w-64 fixed inset-y-0 left-0 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition duration-300 ease-in-out z-20 flex flex-col`}>
        {/* Cabeçalho principal do app */}
        <div className="flex-shrink-0 h-16 bg-purple-900 shadow-md">
          {/* Sem texto no cabeçalho da sidebar */}
        </div>
        
        {/* Conteúdo da sidebar com scroll */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Removido o label de "Painel Administrativo" */}
          
          <nav className="flex-1 px-2 overflow-y-auto py-2 mt-2">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path))
                      ? 'bg-purple-100 text-purple-900' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className={`mr-3 ${
                    pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path))
                      ? 'text-purple-900' 
                      : 'text-gray-500'
                  }`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
            
            {/* Seções adicionais da sidebar */}
            <div className="mt-6 pt-3 border-t border-gray-200">
              <div className="px-2 mb-2">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  Navegação
                </h3>
              </div>
              <Link
                href="/"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <Home size={20} className="mr-3 text-gray-500" />
                <span>Site Principal</span>
              </Link>
            </div>
          </nav>
          
          {/* Footer da sidebar */}
          <div className="flex-shrink-0 px-2 py-4 border-t border-gray-200">
            <div className="flex items-center px-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                A
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">Admin</p>
                <p className="text-xs text-gray-500">Logado</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('rpx-admin-auth');
                router.push('/admin/login');
              }}
              className="flex w-full items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut size={18} className="mr-3" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-purple-900 border-b border-purple-800 shadow-md">
          <div className="flex items-center h-16 px-4 md:px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-white hover:bg-purple-800 md:hidden"
              >
                <Menu size={24} />
              </button>
              <h2 className="ml-2 text-lg font-bold text-white">
                RPX Admin
              </h2>
            </div>
            
            <div className="flex items-center ml-auto">
              <Link 
                href="/" 
                className="text-white hover:bg-purple-800 px-3 py-2 rounded-lg border border-purple-700 flex items-center text-sm transition-colors"
              >
                <Home size={16} className="mr-2" />
                Visitar Site
              </Link>
            </div>
          </div>
        </header>

        {/* Overlay para fechar o menu em telas menores */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-10 bg-black bg-opacity-50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 