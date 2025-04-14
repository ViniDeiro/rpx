'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SponsorBanner } from '../ui/SponsorBanner';
import { 
  Home, Users, Award, BarChart2, ShoppingBag, 
  Settings, HelpCircle, LogOut
} from 'react-feather';
import { IconProps } from 'react-feather';

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<IconProps>;
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  
  const mainLinks: SidebarLink[] = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/matches', label: 'Partidas', icon: Users },
    { href: '/tournaments', label: 'Torneios', icon: Award },
    { href: '/ranking', label: 'Rankings', icon: BarChart2 },
    { href: '/store', label: 'Loja', icon: ShoppingBag },
  ];
  
  const bottomLinks: SidebarLink[] = [
    { href: '/settings', label: 'Configurações', icon: Settings },
    { href: '/support', label: 'Ajuda', icon: HelpCircle },
    { href: '/logout', label: 'Sair', icon: LogOut },
  ];
  
  const renderLinks = (links: SidebarLink[]) => {
    return links.map(link => {
      const isActive = pathname === link.href;
      const Icon = link.icon;
      
      return (
        <li key={link.href}>
          <Link 
            href={link.href}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
              ${isActive 
                ? 'bg-purple-900/30 text-purple-400 border-l-2 border-purple-500' 
                : 'text-gray-400 hover:bg-card-hover hover:text-white'}
            `}
          >
            <Icon size={20} className={isActive ? 'text-purple-400' : 'text-gray-400'} />
            <span>{link.label}</span>
            
            {/* Indicador de ativo */}
            {isActive && (
              <span className="ml-auto">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
              </span>
            )}
          </Link>
        </li>
      );
    });
  };
  
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-card-bg border-r border-gray-800 z-10 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex items-center">
        <Link href="/" className="flex items-center justify-center">
          <span className="text-2xl font-bold">RPX<span className="text-purple-500">BET</span></span>
        </Link>
      </div>
      
      {/* Links de navegação principais */}
      <div className="flex-grow overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {renderLinks(mainLinks)}
        </ul>
        
        {/* Patrocinador na sidebar */}
        <div className="mt-6 mb-6 px-2">
          <SponsorBanner variant="sidebar" />
        </div>
      </div>
      
      {/* Links inferiores */}
      <div className="py-4 px-2 border-t border-gray-800">
        <ul className="space-y-1">
          {renderLinks(bottomLinks)}
        </ul>
      </div>
    </aside>
  );
}; 