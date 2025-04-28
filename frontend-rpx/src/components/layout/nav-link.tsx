'use client';

import React, { useMemo } from 'react';
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

export const NavLink: React.FC<NavLinkProps> = React.memo(({
  href,
  exact = false,
  children,
  className = '',
  activeClassName = 'text-primary',
  onClick,
}) => {
  const pathname = usePathname() || '';
  
  const isActive = useMemo(() => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && (href !== '/' || pathname === '/');
  }, [pathname, href, exact]);

  const baseClasses = useMemo(() => `
    px-4 py-2 rounded-md text-sm font-medium transition-colors relative
    ${isActive ? activeClassName : 'text-foreground hover:text-primary-light hover:bg-card-hover'}
    ${className}
  `, [isActive, activeClassName, className]);

  return (
    <Link 
      href={href} 
      className={baseClasses}
      onClick={onClick}
      prefetch={false}
    >
      {children}
      {isActive && (
        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-primary-light to-transparent"></span>
      )}
    </Link>
  );
});

NavLink.displayName = 'NavLink'; 