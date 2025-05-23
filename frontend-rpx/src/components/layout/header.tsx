'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, DollarSign, RefreshCw } from 'react-feather';
import ImagePaths from '@/utils/image-paths';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from 'next-auth/react';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { User, ChevronDown } from 'react-feather';
import OptimizedImage from '../ui/optimized-image';
import { formatCurrency } from '@/utils/formatters';
import { UserAvatar } from '../ui/user-avatar';
import { useTheme } from 'next-themes';
import { NavLink } from './nav-link';
import { MobileMenu } from './mobile-menu';
import { UserMenu } from './user-menu';

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const session = useSession();
  const status = session?.status;

  // Função para fazer logout
  const handleLogout = () => {
    console.log('Logout solicitado no menu header');
    try {
      logout();
      // Fechar o menu dropdown
      setIsProfileOpen(false);
      // Redirecionar para a página de login
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro ao processar logout:', error);
    }
  };

  // Função para forçar atualização do perfil
  const handleRefreshProfile = async () => {
    try {
      await refreshUser();
      console.log('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  // Pré-carregar links importantes quando o componente montar
  useEffect(() => {
    // Pré-carregar páginas principais para navegação mais rápida
    const prefetchLinks = ['/lobby', '/matches', '/tournaments', '/ranking', '/store'];
    
    // Usar requestIdleCallback para não bloquear a renderização inicial
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        prefetchLinks.forEach(path => {
          router.prefetch(path);
        });
      });
    } else {
      // Fallback para browsers que não suportam requestIdleCallback
      setTimeout(() => {
        prefetchLinks.forEach(path => {
          router.prefetch(path);
        });
      }, 1000);
    }
  }, [router]);

  // Otimizar o evento de scroll usando throttle e requestAnimationFrame
  useEffect(() => {
    let ticking = false;
    let lastScrollY = window.scrollY;
    let rafId: number;
    
    const handleScroll = () => {
      lastScrollY = window.scrollY;
      
      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          setIsScrolled(lastScrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Memoizar os links de navegação para evitar recriação desnecessária
  const navLinks = useMemo(() => [
    { href: '/', label: 'Início' },
    { href: '/lobby', label: 'Lobby' },
    { href: '/matches', label: 'Desafios' },
    { href: '/tournaments', label: 'Torneios' },
    { href: '/ranking', label: 'Rankings' },
    { href: '/store', label: 'Loja' },
    { href: '/sponsors', label: 'Parceiros' },
  ], []);

  return (
    <header 
      className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-300
        ${isScrolled 
          ? 'bg-indigo-950/80 backdrop-blur-sm border-b border-purple-800/20 shadow-sm' 
          : 'bg-indigo-950/30 backdrop-blur-sm'
        }
      `}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" prefetch={false} className="flex items-center">
            <div className="relative h-10 w-32">
              <Image 
                src={ImagePaths.logo} 
                alt="RPX Logo"
                width={120}
                height={50}
                priority
                className="w-full h-full object-contain"
              />
            </div>
          </Link>

          {/* Links de navegação em desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  prefetch={true}
                  scroll={false}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-colors relative
                    ${isActive
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary-light hover:bg-card-hover'
                    }
                  `}
                  onClick={(e) => {
                    if (isActive) {
                      e.preventDefault();
                      return;
                    }
                    // Iniciar pré-carregamento ao hover
                    router.prefetch(link.href);
                  }}
                >
                  {link.label}
                  {isActive && (
                    <motion.span 
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-primary-light to-transparent"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Autenticação e perfil - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Componente de saldo */}
                <div className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-800/40 to-purple-800/40 rounded-full border border-indigo-500/30 shadow-sm hover:shadow-indigo-500/20 hover:border-indigo-500/50 transition-all duration-200">
                  <span className="font-medium text-sm text-white">
                    R$ {(user?.wallet?.balance || user?.balance || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <UserMenu user={user} status="authenticated">
                  <button 
                    onClick={handleRefreshProfile}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <RefreshCw size={16} />
                    <span>Atualizar Perfil</span>
                  </button>
                </UserMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  asChild 
                  size="md" 
                  className="px-4 py-1.5 text-sm font-medium rounded-lg hover:bg-indigo-700/30 hover:text-indigo-300 transition-all duration-200"
                >
                  <Link href="/auth/login">Entrar</Link>
                </Button>
                <Button 
                  variant="default" 
                  asChild 
                  size="md" 
                  className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 border-0 rounded-lg transition-all duration-200"
                >
                  <Link href="/auth/register">Cadastrar</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Botão de menu mobile */}
          <button
            className="md:hidden p-2 rounded-md focus:outline-none"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div className="md:hidden">
        <MobileMenu 
          links={navLinks} 
          user={user}
          status={isAuthenticated ? "authenticated" : "unauthenticated"}
          showThemeToggle={true}
        />
      </div>

      {/* Mobile Menu */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-80 
          bg-card-bg shadow-xl 
          transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="absolute inset-0 bg-gradient-radial opacity-5 pointer-events-none" />
        <div className="relative flex items-center justify-between p-4">
          <div className="text-lg font-semibold">Menu</div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-card-hover text-foreground-muted hover:text-foreground transition-colors"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}; 