import React from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { useImagePreload } from '@/hooks/useImagePreload';

interface UserAvatarProps {
  src?: string;
  fallbackSrc?: string;
  username?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  transform?: boolean; // Para imagens que precisam de transform
}

const sizes = {
  sm: { width: 28, height: 28, text: 'text-xs' },
  md: { width: 36, height: 36, text: 'text-sm' },
  lg: { width: 48, height: 48, text: 'text-base' },
  xl: { width: 96, height: 96, text: 'text-xl' },
};

export function UserAvatar({
  src,
  fallbackSrc = '/images/avatar-placeholder.svg',
  username,
  name,
  size = 'md',
  className = '',
  transform = false,
}: UserAvatarProps) {
  const { isLoading, imageUrl, error } = useImagePreload(src, fallbackSrc);
  
  // Determinar a letra para o fallback
  const fallbackLetter = (username || name || 'U').charAt(0).toUpperCase();
  
  // Tamanhos com base no tamanho escolhido
  const { width, height, text } = sizes[size];
  
  // Classes condicionais
  const imageClasses = `
    object-cover 
    ${transform ? 'transform -translate-y-2' : ''} 
    ${isLoading ? 'opacity-0' : 'opacity-100'} 
    transition-opacity duration-300
  `;
  
  return (
    <Avatar className={className}>
      {/* Fallback sempre visível enquanto a imagem carrega */}
      <AvatarFallback className={`${text} bg-indigo-900 text-primary-light font-bold`}>
        {fallbackLetter}
      </AvatarFallback>
      
      {/* Imagem que aparece com fade quando carregada */}
      {!error && (
        <AvatarImage
          src={imageUrl}
          alt={username || name || 'Usuário'}
          width={width}
          height={height}
          className={imageClasses}
        />
      )}
    </Avatar>
  );
} 