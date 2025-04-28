'use client';

import React, { ReactNode, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileMenu } from '@/components/layout/mobile-menu';

interface LayoutContainerProps {
  children: ReactNode;
}

export function LayoutContainer({ children }: LayoutContainerProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Callback memoizado para o toggle do menu
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  // Callback memoizado para fechar o menu
  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);
  
  // Verificar se é uma rota que não usa o layout padrão
  const isAuthRoute = useMemo(() => {
    return pathname?.startsWith('/auth') || false;
  }, [pathname]);
  
  // Se for uma rota de autenticação, retornar apenas o conteúdo da página
  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={closeMenu}
      />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
} 