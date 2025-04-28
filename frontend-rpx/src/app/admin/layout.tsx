'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart2, Users, Activity, DollarSign, Package, Settings, 
  Home, Menu, X, ChevronRight, CheckSquare, Award, ShoppingBag,
  Star, Shield, Flag, Image
} from 'react-feather';
import LogoutButton from './components/LogoutButton';

// Estilos globais para corrigir problemas de contraste no admin
const globalStyles = `
  /* Corrigir problema de contraste nos inputs */
  .admin-page input, 
  .admin-page textarea, 
  .admin-page select {
    color: #000 !important;
    background-color: #fff !important;
    border: 1px solid #ccc !important;
  }
  
  /* Forçar cor de texto para inputs */
  .admin-page input::placeholder {
    color: #666 !important;
    opacity: 1 !important;
  }
  
  /* Outros elementos que possam precisar de contraste ajustado */
  .admin-page .form-field {
    color: #000 !important;
  }
  
  /* Corrigir texto em tabelas e outros elementos */
  .admin-page table, 
  .admin-page th, 
  .admin-page td, 
  .admin-page p, 
  .admin-page span, 
  .admin-page h1, 
  .admin-page h2, 
  .admin-page h3 {
    color: #333 !important;
  }
  
  /* Exceção para botões coloridos */
  .admin-page button.bg-purple-600 {
    color: white !important;
  }
`;

// Comentário sobre o layout admin
// Não precisamos mais exportar metadata aqui pois o RootLayout já
// está configurado para não aplicar o Layout principal nas páginas de admin

// Esta função seria substituída por sua lógica de autenticação real
const useAdminAuth = () => {
  // HACK TEMPORÁRIO: Forçar acesso admin para desenvolvimento
  // REMOVER ESTA SOLUÇÃO EM PRODUÇÃO!
  return { isAdmin: true, isLoading: false };
  
  // Código original comentado abaixo:
  /*
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificação real usando o token JWT
    const checkAdmin = async () => {
      try {
        setIsLoading(true);
        
        // Em ambiente de desenvolvimento, sempre permitir acesso admin
        // ISSO É APENAS PARA DESENVOLVIMENTO! REMOVER EM PRODUÇÃO!
        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ADMIN_DEV_MODE === 'true') {
          console.log('⚠️ MODO DESENVOLVIMENTO: Acesso admin liberado automaticamente no layout');
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }
        
        // Nova implementação: usar apenas a sessão Next-Auth, não localStorage
        console.log('Verificando autenticação via API...');
        
        // Fazer requisição à API para verificar status
        const response = await fetch('/api/auth/check-admin', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          },
          credentials: 'include' // Importante para enviar cookies
        });
        
        // Se não estiver autenticado como admin, resposta será 403 ou 401
        if (!response.ok) {
          console.log('Usuário não está autenticado como admin:', response.status);
          setIsAdmin(false);
          return;
        }
        
        // Se chegou aqui, está autenticado
        console.log('Usuário autenticado como admin via API');
        setIsAdmin(true);
        
      } catch (error) {
        console.error('Erro ao verificar status admin:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdmin();
  }, []);

  return { isAdmin, isLoading };
  */
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathnameRaw = usePathname();
  const pathname = pathnameRaw || '/admin';
  const { isAdmin, isLoading } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Removendo o redirecionamento automático para evitar loops
  // Mostrar uma mensagem de acesso negado em vez de redirecionar

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

  // Se estiver na página de login, renderizar o conteúdo diretamente sem verificação
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Se não for admin e tenta acessar uma página admin, mostrar mensagem de acesso negado
  if (!isAdmin && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta área. Entre com uma conta administrativa.</p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => router.push('/admin/login')}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
              >
                Fazer Login como Admin
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Voltar para o Site Principal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: <BarChart2 size={20} /> },
    { path: '/admin/usuarios', label: 'Usuários', icon: <Users size={20} /> },
    { path: '/admin/partidas', label: 'Partidas', icon: <Activity size={20} /> },
    { path: '/admin/verificacao', label: 'Verificação', icon: <CheckSquare size={20} /> },
    { path: '/admin/validacao-apostas', label: 'Validar Apostas', icon: <Award size={20} /> },
    { path: '/admin/torneios', label: 'Torneios', icon: <Award size={20} /> },
    { path: '/admin/insignias', label: 'Insígnias', icon: <Shield size={20} /> },
    { path: '/admin/ranks', label: 'Ranks', icon: <Star size={20} /> },
    { path: '/admin/update-rank', label: 'Atualizar Rank', icon: <Star size={20} /> },
    { path: '/admin/banners', label: 'Banners', icon: <Image size={20} /> },
    { path: '/admin/financeiro', label: 'Financeiro', icon: <DollarSign size={20} /> },
    { path: '/admin/personagens', label: 'Personagens', icon: <Package size={20} /> },
    { path: '/admin/loja', label: 'Loja', icon: <ShoppingBag size={20} /> },
    { path: '/admin/configuracoes', label: 'Configurações', icon: <Settings size={20} /> },
  ];

  // Se for admin ou a verificação ainda não terminou, renderiza o layout completo
  return (
    <div className="admin-page">
      <style jsx global>{globalStyles}</style>
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
              <LogoutButton />
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
    </div>
  );
} 