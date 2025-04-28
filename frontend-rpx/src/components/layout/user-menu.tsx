'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Settings, CreditCard, HelpCircle } from 'react-feather';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserMenuProps {
  user: any;
  status: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, status }) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Certificar-se de que o componente está montado antes de renderizar
  // para evitar problemas com renderização no servidor vs cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  // Se não estiver montado ainda, não renderize nada para evitar inconsistências
  if (!mounted) {
    return null;
  }

  if (status === 'loading') {
    return (
      <Button variant="ghost" size="icon" disabled>
        <div className="h-7 w-7 rounded-full bg-gray-300 animate-pulse"></div>
      </Button>
    );
  }

  if (status === 'unauthenticated' || !user) {
    return (
      <div className="flex items-center space-x-1">
        <Button variant="ghost" asChild size="sm">
          <Link href="/auth/login">Entrar</Link>
        </Button>
        <Button variant="default" asChild size="sm">
          <Link href="/auth/register">Cadastrar</Link>
        </Button>
      </div>
    );
  }

  // Obter as iniciais do nome do usuário para o fallback do avatar
  const getInitials = () => {
    const displayName = user.name || user.username || user.email || 'U';
    
    if (!displayName) return 'U';
    
    return displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const userInitials = getInitials();

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-14 w-14 rounded-full p-0 overflow-hidden bg-transparent hover:bg-transparent"
        >
          <div className="h-full w-full rounded-full overflow-hidden ring-2 ring-indigo-500/40 hover:ring-indigo-500/80 transition-all duration-200 shadow-md hover:shadow-indigo-500/30">
            <Avatar className="h-full w-full">
              <AvatarImage 
                src={user.image || user.avatarUrl} 
                alt={user.name || 'Avatar do usuário'} 
                className="h-full w-full object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-medium text-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 overflow-hidden rounded-xl border border-indigo-800/30 bg-gradient-to-b from-gray-900 to-slate-900 shadow-xl">
        <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 px-4 py-3 -mx-1 -mt-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white/20">
              <AvatarImage 
                src={user.image || user.avatarUrl} 
                alt={user.name || 'Avatar do usuário'} 
              />
              <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white font-medium text-lg">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white">{user.name || user.username || 'Usuário'}</p>
              <p className="text-xs text-indigo-200/80 truncate">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="py-2 px-1">
          <DropdownMenuItem asChild className="py-2 px-3 rounded-lg my-1 hover:bg-indigo-900/50 focus:bg-indigo-900/50">
            <Link href="/profile" className="flex cursor-pointer items-center">
              <User className="mr-2 h-4 w-4 text-indigo-400" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="py-2 px-3 rounded-lg my-1 hover:bg-indigo-900/50 focus:bg-indigo-900/50">
            <Link href="/profile/settings" className="flex cursor-pointer items-center">
              <Settings className="mr-2 h-4 w-4 text-indigo-400" />
              <span>Configurações</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="py-2 px-3 rounded-lg my-1 hover:bg-indigo-900/50 focus:bg-indigo-900/50">
            <Link href="/profile/wallet" className="flex cursor-pointer items-center">
              <CreditCard className="mr-2 h-4 w-4 text-indigo-400" />
              <span>Carteira</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="py-2 px-3 rounded-lg my-1 hover:bg-indigo-900/50 focus:bg-indigo-900/50">
            <Link href="/help" className="flex cursor-pointer items-center">
              <HelpCircle className="mr-2 h-4 w-4 text-indigo-400" />
              <span>Ajuda</span>
            </Link>
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="bg-indigo-800/30" />
        
        <div className="py-2 px-1">
          <DropdownMenuItem 
            onClick={handleLogout}
            className="py-2 px-3 rounded-lg my-1 text-red-400 hover:text-red-300 hover:bg-red-950/50 focus:bg-red-950/50 focus:text-red-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 