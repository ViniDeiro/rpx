'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface SponsorBannerProps {
  variant?: 'sidebar' | 'horizontal' | 'compact';
  className?: string;
}

export const SponsorBanner: React.FC<SponsorBannerProps> = ({ 
  variant = 'horizontal',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  
  // Efeito de animação do gradiente
  useEffect(() => {
    if (!isHovered) return;
    
    const interval = setInterval(() => {
      setGlowPosition({
        x: Math.random() * 100,
        y: Math.random() * 100
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isHovered]);

  // Determinar o layout e tamanho baseado na variante
  const getLayoutStyles = () => {
    switch (variant) {
      case 'sidebar':
        return {
          containerClass: 'flex flex-col items-center p-4 rounded-lg',
          logoSize: { height: 60, width: 180 }
        };
      case 'compact':
        return {
          containerClass: 'flex items-center justify-between p-2 rounded-lg',
          logoSize: { height: 40, width: 120 }
        };
      default: // horizontal
        return {
          containerClass: 'flex items-center justify-between p-4 rounded-lg',
          logoSize: { height: 50, width: 160 }
        };
    }
  };

  const { containerClass, logoSize } = getLayoutStyles();

  return (
    <div 
      className={`${containerClass} relative overflow-hidden ${className}`}
      style={{
        background: isHovered 
          ? `linear-gradient(110deg, rgba(15,15,20,0.9), rgba(46,16,101,0.85), rgba(15,15,20,0.9))`
          : `linear-gradient(110deg, rgba(15,15,20,0.95), rgba(34,12,75,0.7), rgba(15,15,20,0.95))`,
        boxShadow: isHovered 
          ? '0 0 20px rgba(138, 43, 226, 0.2), inset 0 0 10px rgba(138, 43, 226, 0.1)'
          : '0 0 10px rgba(0,0,0,0.3)',
        transition: 'all 0.4s ease-in-out, background 0.6s ease, box-shadow 0.6s ease',
        borderRadius: '10px',
        border: '1px solid rgba(138, 43, 226, 0.3)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Efeito de luz radial */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: `radial-gradient(circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(178, 107, 255, 0.25) 0%, transparent 70%)`,
          transition: 'background 1.5s ease-out',
        }}
      />
      
      {/* Linhas decorativas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30"
          style={{ 
            transform: isHovered ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.8s ease-in-out'
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-30"
          style={{ 
            transform: isHovered ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.8s ease-in-out'
          }}
        />
      </div>
      
      {/* Conteúdo do Banner */}
      <div className="relative z-10">
        {variant === 'horizontal' && (
          <div className="mr-4">
            <p className="text-gray-200 text-sm font-medium">
              <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-purple-400">Patrocinado por</span>
            </p>
          </div>
        )}
        
        {variant === 'sidebar' && (
          <div className="mb-3">
            <p className="text-gray-200 text-sm text-center font-medium">
              <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-purple-400">Patrocinado por</span>
            </p>
          </div>
        )}
        
        <a 
          href="https://luck.bet.br" 
          target="_blank" 
          rel="noopener noreferrer"
          className="transition-transform duration-300 ease-out flex items-center justify-center"
          style={{
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <div 
            className="relative bg-[#1a1a1a] rounded-lg p-3"
            style={{ 
              height: logoSize.height + 'px', 
              width: logoSize.width + 'px',
              boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
              transition: 'box-shadow 0.3s ease'
            }}
          >
            <Image
              src="/images/sponsors/luckbet.png"
              alt="LuckyBet"
              fill
              className="object-contain"
            />
          </div>
        </a>
      </div>
      
      {variant === 'horizontal' && (
        <div className="flex items-center relative z-10">
          <a 
            href="https://luck.bet.br"
            target="_blank"
            rel="noopener noreferrer" 
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300"
            style={{
              background: isHovered 
                ? 'linear-gradient(90deg, rgba(255, 204, 41, 0.2) 0%, rgba(255, 184, 0, 0.2) 100%)' 
                : 'linear-gradient(90deg, rgba(255, 204, 41, 0.1) 0%, rgba(255, 184, 0, 0.1) 100%)',
              border: '1px solid rgba(255, 184, 0, 0.3)',
              color: '#ffcc29',
              boxShadow: isHovered ? '0 0 10px rgba(255, 204, 41, 0.2)' : 'none'
            }}
          >
            <span>Conheça as melhores odds</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-300 ${isHovered ? 'translate-x-0.5' : ''}`}>
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}; 