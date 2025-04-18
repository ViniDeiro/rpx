'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  exact?: boolean;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
}

export const NavLink: React.FC<NavLinkProps> = ({
  href,
  exact = false,
  children,
  className = '',
  activeClassName = 'text-primary',
  onClick,
}) => {
  const pathname = usePathname() || '';
  const isActive = exact 
    ? pathname === href 
    : pathname.startsWith(href) && (href !== '/' || pathname === '/');

  const baseClasses = `
    px-4 py-2 rounded-md text-sm font-medium transition-colors relative
    ${isActive ? activeClassName : 'text-foreground hover:text-primary-light hover:bg-card-hover'}
    ${className}
  `;

  return (
    <Link 
      href={href} 
      className={baseClasses}
      onClick={onClick}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-primary-light to-transparent"></span>
      )}
    </Link>
  );
}; 