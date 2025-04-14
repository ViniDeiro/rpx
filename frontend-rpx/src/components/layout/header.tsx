'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu, X, User, DollarSign, ChevronDown } from 'react-feather';
import OptimizedImage from '../ui/optimized-image';
import ImagePaths from '@/utils/image-paths';
import Image from 'next/image';
import { formatCurrency } from '@/utils/formatters';

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();

  // Mock user - em produção viria de um contexto de autenticação
  const user = {
    name: 'Usuário RPX',
    balance: 2500,
    avatar: '/images/avatar-placeholder.svg',
    isLoggedIn: true
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/lobby', label: 'Lobby' },
    { href: '/matches', label: 'Partidas' },
    { href: '/tournaments', label: 'Torneios' },
    { href: '/ranking', label: 'Rankings' },
    { href: '/store', label: 'Loja' },
    { href: '/sponsors', label: 'Patrocinadores' },
  ];

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
          <Link href="/" className="flex items-center">
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
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-colors relative
                    ${isActive
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary-light hover:bg-card-hover'
                    }
                  `}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-primary-light to-transparent"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Autenticação e perfil - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user.isLoggedIn ? (
              <>
                {/* Carteira */}
                <div className="flex items-center bg-purple-900/30 border border-gray-700 rounded-full px-3 py-1.5">
                  <span className="text-sm font-medium text-white">{formatCurrency(user.balance)}</span>
                </div>
                
                {/* Menu de perfil */}
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`
                      flex items-center space-x-2 rounded-full px-2 py-1 
                      transition-all focus:outline-none
                      ${isProfileOpen 
                        ? 'ring-2 ring-primary/30 shadow-rpx bg-card-bg/80' 
                        : 'bg-card-bg border border-border hover:border-primary/30'}
                    `}
                  >
                    <div className="relative w-8 h-8 overflow-hidden rounded-full">
                      <OptimizedImage 
                        src={user.avatar} 
                        alt={user.name}
                        width={32}
                        height={32}
                        className="object-cover"
                        fallbackSrc={ImagePaths.avatarPlaceholder}
                      />
                    </div>
                    <ChevronDown className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} size={16} />
                  </button>
                  
                  {isProfileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 rounded-xl bg-card-bg border border-border shadow-rpx py-1 z-10"
                    >
                      <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-card-hover">
                        Meu Perfil
                      </Link>
                      <Link href="/profile/bets" className="block px-4 py-2 text-sm hover:bg-card-hover">
                        Minhas Apostas
                      </Link>
                      <Link href="/profile/wallet" className="block px-4 py-2 text-sm hover:bg-card-hover">
                        Carteira
                      </Link>
                      <hr className="my-1 border-border" />
                      <button className="w-full text-left px-4 py-2 text-sm text-error hover:bg-card-hover">
                        Sair
                      </button>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link 
                  href="/auth/login" 
                  className="btn-outline"
                >
                  Entrar
                </Link>
                <Link 
                  href="/auth/register" 
                  className="btn-gradient"
                >
                  Registrar
                </Link>
              </>
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
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden glass-effect"
        >
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      px-4 py-3 rounded-md text-base font-medium transition-all relative
                      ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-card-hover'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute left-0 top-0 h-full w-1 bg-primary rounded-l-md"></span>
                    )}
                  </Link>
                );
              })}
              
              <hr className="border-border my-2" />
              
              {user.isLoggedIn ? (
                <>
                  <div className="flex items-center px-4 py-2">
                    <div className="relative w-10 h-10 overflow-hidden rounded-full mr-3">
                      <OptimizedImage 
                        src={user.avatar} 
                        alt={user.name}
                        width={40}
                        height={40}
                        className="object-cover"
                        fallbackSrc={ImagePaths.avatarPlaceholder}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-300">
                        {formatCurrency(user.balance)}
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/profile"
                    className="px-4 py-3 rounded-md text-base font-medium hover:bg-card-hover"
                    onClick={() => setIsOpen(false)}
                  >
                    <User size={18} className="mr-3" />
                    <span>Perfil</span>
                  </Link>
                  
                  <button 
                    className="px-4 py-3 text-left rounded-md text-base font-medium text-error hover:bg-card-hover"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <div className="flex flex-col space-y-2 px-4 py-2">
                  <Link 
                    href="/auth/login" 
                    className="btn-outline w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Entrar
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="btn-gradient w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Registrar
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </motion.div>
      )}

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