'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, Settings, User as UserIcon } from 'react-feather';
import { signOut } from 'next-auth/react';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ui/theme-toggle';

interface MobileMenuProps {
  links: { href: string; label: string }[];
  user: any;
  status: string;
  showThemeToggle?: boolean;
}

export const MobileMenu = ({ links, user, status, showThemeToggle = false }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <div className={`
      fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Menu Content */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xs bg-card-bg shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-card-hover"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {/* Navigation Links */}
          <nav className="flex flex-col space-y-2 mb-6">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-card-hover hover:text-primary-light'
                    }
                  `}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          
          {/* User Section */}
          <div className="mt-auto">
            {status === 'authenticated' && user ? (
              <div className="space-y-3">
                <div className="flex items-center p-3 rounded-lg bg-card-hover">
                  <div className="w-10 h-10 rounded-full bg-primary-dark flex items-center justify-center overflow-hidden mr-3">
                    {user.image ? (
                      <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={20} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{user.name || 'Usuário'}</p>
                    <p className="text-xs text-foreground-muted truncate max-w-[150px]">
                      {user.email || ''}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center p-2 rounded-md hover:bg-card-hover w-full"
                  >
                    <UserIcon size={16} className="mr-2" />
                    <span>Perfil</span>
                  </Link>
                  
                  <Link
                    href="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center p-2 rounded-md hover:bg-card-hover w-full"
                  >
                    <Settings size={16} className="mr-2" />
                    <span>Configurações</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center p-2 rounded-md hover:bg-card-hover w-full text-left"
                  >
                    <LogOut size={16} className="mr-2" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button asChild variant="default" className="w-full">
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                    Entrar
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                    Cadastrar
                  </Link>
                </Button>
              </div>
            )}
            
            {showThemeToggle && (
              <div className="mt-4 flex justify-center">
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 