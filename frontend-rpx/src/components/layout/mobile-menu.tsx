'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from '@/components/layout/nav-link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import { 
  Moon, 
  Sun, 
  X,
  Home,
  Book,
  GraduationCap,
  Flask,
  Scale,
  Users,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import clsx from 'clsx';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Monta apenas uma vez
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  const handleNavigation = useCallback((href: string) => {
    onClose();
    router.push(href);
  }, [onClose, router]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const navigationItems: NavItem[] = useMemo(() => [
    { href: '/', label: 'Início', icon: <Home className="h-5 w-5" /> },
    { href: '/equipe', label: 'Equipe', icon: <Users className="h-5 w-5" /> },
    { href: '/textos', label: 'Textos', icon: <Book className="h-5 w-5" /> },
    { href: '/cursos', label: 'Cursos', icon: <GraduationCap className="h-5 w-5" /> },
    { href: '/ciencia', label: 'Ciência', icon: <Flask className="h-5 w-5" /> },
    { href: '/direito', label: 'Direito', icon: <Scale className="h-5 w-5" /> },
    { href: '/perguntas-frequentes', label: 'FAQ', icon: <HelpCircle className="h-5 w-5" /> },
    { href: '/fale-conosco', label: 'Contato', icon: <MessageCircle className="h-5 w-5" /> },
  ], []);

  // Animação do menu
  const menuVariants = {
    closed: {
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      x: '0%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  // Animação dos itens
  const itemVariants = {
    closed: { 
      x: 50, 
      opacity: 0,
      transition: { duration: 0.2 } 
    },
    open: { 
      x: 0, 
      opacity: 1,
      transition: { duration: 0.4 } 
    }
  };

  // Renderiza apenas no cliente
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Menu */}
          <motion.div
            className="fixed top-0 right-0 h-full w-80 max-w-[85%] bg-background shadow-xl z-50 flex flex-col overflow-y-auto"
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold">Menu</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="rounded-full hover:bg-card-hover"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Nav Items */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => (
                  <motion.li key={item.href} variants={itemVariants}>
                    <NavLink
                      href={item.href}
                      className="flex items-center py-3 px-4 w-full"
                      onClick={onClose}
                    >
                      <span className="mr-3 text-muted-foreground">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
            </nav>
            
            {/* Footer */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Modo de tema</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleTheme}
                  className={clsx(
                    "rounded-full transition-colors",
                    theme === 'dark' ? "bg-background text-primary" : "bg-background text-primary"
                  )}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {!session ? (
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    variant="default"
                    onClick={() => handleNavigation('/auth/login')}
                  >
                    Entrar
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => handleNavigation('/auth/register')}
                  >
                    Criar conta
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={() => handleNavigation('/perfil')}
                >
                  Perfil
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 