'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { memo } from 'react';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavLinkComponent = ({ href, children, className = '', onClick }: NavLinkProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname === href;

  const handleClick = (e: React.MouseEvent) => {
    if (isActive) {
      e.preventDefault();
      return;
    }

    // Chamar o onClick passado como prop se existir
    onClick?.();

    // Iniciar pré-carregamento ao clicar
    router.prefetch(href);
  };

  return (
    <Link
      href={href}
      prefetch={true}
      scroll={false}
      className={`
        ${className}
        ${isActive ? 'text-primary font-medium' : 'text-foreground hover:text-primary-light'}
      `}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
};

// Memoizar o componente para evitar re-renderizações desnecessárias
export const NavLink = memo(NavLinkComponent); 