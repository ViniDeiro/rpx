'use client';

import React from 'react';
import { User } from 'react-feather';

export interface UserAvatarProps {
  image?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar = ({ image, name, size = 'md', className = '' }: UserAvatarProps) => {
  // Mapear tamanhos
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg'
  };

  // Gerar iniciais do nome se existir
  const initials = name ? 
    name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() 
    : '';

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        rounded-full overflow-hidden flex items-center justify-center 
        bg-primary-dark text-white
        ${className}
      `}
    >
      {image ? (
        <img 
          src={image} 
          alt={name || 'User'} 
          className="w-full h-full object-cover"
        />
      ) : initials ? (
        <span className="font-medium">{initials}</span>
      ) : (
        <User
          size={size === 'xs' ? 12 : size === 'sm' ? 16 : size === 'md' ? 20 : 24}
          className="opacity-80"
        />
      )}
    </div>
  );
}; 