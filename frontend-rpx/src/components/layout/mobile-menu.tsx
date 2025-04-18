'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, Users, Award, Calendar, ShoppingBag, Star, LogOut, User } from 'react-feather';
import { Session } from 'next-auth';
import { Button } from '../ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
}

interface MobileMenuProps {
  links: NavItem[];
  user: any;
  status: 'authenticated' | 'loading' | 'unauthenticated';
  showThemeToggle?: boolean;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  links,
  user,
  status,
  showThemeToggle = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || '';
  const { theme, setTheme } = useTheme();

  const toggleMenu = () => {
    setIsOpen(prev => !prev);
  };

  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'início':
        return <Home className="h-5 w-5" />;
      case 'lobby':
        return <Users className="h-5 w-5" />;
      case 'desafios':
        return <Award className="h-5 w-5" />;
      case 'torneios':
        return <Calendar className="h-5 w-5" />;
      case 'rankings':
        return <Star className="h-5 w-5" />;
      case 'loja':
        return <ShoppingBag className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  return (
    <>
      <button
        className="md:hidden p-2 rounded-md focus:outline-none"
        onClick={toggleMenu}
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
            <motion.div
              className="fixed right-0 top-0 h-full w-4/5 max-w-sm bg-card-bg shadow-xl p-6 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  className="p-2 rounded-full hover:bg-card-hover"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-6">
                <div className="space-y-2">
                  {links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center py-3 px-4 rounded-md space-x-3 ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-card-hover'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {getIcon(link.label)}
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-gray-800">
                  {status === 'authenticated' && user ? (
                    <>
                      <div className="flex items-center mb-4 px-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name || 'Avatar'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.name || 'Jogador'}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Link
                          href="/profile"
                          className="flex items-center py-3 px-4 rounded-md space-x-3 hover:bg-card-hover"
                          onClick={() => setIsOpen(false)}
                        >
                          <User className="h-5 w-5" />
                          <span>Perfil</span>
                        </Link>
                        <button
                          className="w-full flex items-center py-3 px-4 rounded-md space-x-3 hover:bg-card-hover text-left"
                          onClick={() => {
                            setIsOpen(false);
                            // Implement logout
                          }}
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Sair</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3 px-4">
                      <Link
                        href="/auth/login"
                        className="block w-full py-2 px-4 bg-primary text-white text-center rounded-md hover:bg-primary-dark"
                        onClick={() => setIsOpen(false)}
                      >
                        Entrar
                      </Link>
                      <Link
                        href="/auth/register"
                        className="block w-full py-2 px-4 bg-transparent border border-primary text-primary text-center rounded-md hover:bg-primary/10"
                        onClick={() => setIsOpen(false)}
                      >
                        Criar conta
                      </Link>
                    </div>
                  )}
                </div>

                {showThemeToggle && (
                  <div className="pt-6 border-t border-gray-800">
                    <div className="flex items-center justify-between px-4">
                      <span>Tema</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      >
                        {theme === 'dark' ? (
                          <Sun className="h-5 w-5" />
                        ) : (
                          <Moon className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 