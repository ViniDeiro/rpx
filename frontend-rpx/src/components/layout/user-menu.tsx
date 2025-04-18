'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { User, Settings, LogOut, ChevronDown, DollarSign } from 'react-feather';
import { Button } from '../ui/button';

interface UserMenuProps {
  user: any;
  status: string;
}

export const UserMenu = ({ user, status }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar o menu quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
    setIsOpen(false);
  };

  // Renderiza diferente baseado no status de autenticação
  if (status === 'loading') {
    return (
      <div className="h-10 w-28 bg-card-hover animate-pulse rounded-md"></div>
    );
  }

  if (status !== 'authenticated' || !user) {
    return (
      <div className="flex items-center space-x-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/auth/login">Entrar</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/register">Cadastrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-card-hover transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary-dark flex items-center justify-center overflow-hidden">
          {user.image ? (
            <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
          ) : (
            <User size={16} className="text-white" />
          )}
        </div>
        <span className="font-medium text-sm hidden sm:inline-block">{user.name || 'Usuário'}</span>
        <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-card-bg border border-border rounded-md shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-border">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-foreground-muted truncate">{user.email}</p>
            {user.balance !== undefined && (
              <div className="flex items-center mt-2 text-sm">
                <DollarSign size={14} className="text-success mr-1" />
                <span>Saldo: R$ {user.balance?.toFixed(2) || '0.00'}</span>
              </div>
            )}
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 hover:bg-card-hover"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} className="mr-2" />
              <span>Meu Perfil</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center px-4 py-2 hover:bg-card-hover"
              onClick={() => setIsOpen(false)}
            >
              <Settings size={16} className="mr-2" />
              <span>Configurações</span>
            </Link>
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 hover:bg-card-hover w-full text-left"
            >
              <LogOut size={16} className="mr-2" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 