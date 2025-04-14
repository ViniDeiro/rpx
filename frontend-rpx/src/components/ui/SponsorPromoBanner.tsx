'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Star, ChevronRight } from 'react-feather';

interface SponsorPromoBannerProps {
  className?: string;
}

export const SponsorPromoBanner: React.FC<SponsorPromoBannerProps> = ({ 
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    
    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return (
    <div 
      ref={bannerRef}
      className={`w-full max-w-6xl mx-auto rounded-xl overflow-hidden relative ${className}`}
      style={{
        height: '180px',
        background: 'linear-gradient(120deg, #0f0f14 0%, #1a0e35 50%, #0f0f14 100%)',
        boxShadow: isHovered 
          ? '0 10px 30px rgba(138, 43, 226, 0.25), 0 0 0 1px rgba(138, 43, 226, 0.2) inset'
          : '0 5px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(138, 43, 226, 0.1) inset',
        transition: 'all 0.5s ease-in-out',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradiente de fundo animado */}
      <div 
        className="absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(circle at 70% 50%, rgba(90, 30, 160, 0.4) 0%, transparent 60%)`,
          filter: 'blur(40px)',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 1.5s ease-out',
        }}
      />
      
      {/* Padrão decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-full h-full">
          <svg width="100%" height="100%" viewBox="0 0 800 200" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0,160 C100,120 200,190 300,140 C400,90 500,170 600,140 C700,110 800,160 800,160 L800,200 L0,200 Z"
              fill="url(#grad1)"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6a11cb" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#a673ff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#6a11cb" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      {/* Barras decorativas */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
        style={{ 
          width: '100%',
          opacity: 0.6,
          transform: `translateX(${isHovered ? '0%' : '-100%'})`,
          transition: 'transform 1s ease-in-out'
        }}
      />
      <div 
        className="absolute top-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"
        style={{ 
          width: '100%',
          opacity: 0.6,
          transform: `translateX(${isHovered ? '0%' : '100%'})`,
          transition: 'transform 1s ease-in-out'
        }}
      />
      
      {/* Pontos brilhantes */}
      {[...Array(5)].map((_, i) => (
        <div 
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: i % 2 === 0 ? '#ffcc29' : '#a673ff',
            boxShadow: i % 2 === 0 
              ? '0 0 10px rgba(255, 204, 41, 0.8), 0 0 20px rgba(255, 204, 41, 0.4)' 
              : '0 0 10px rgba(166, 115, 255, 0.8), 0 0 20px rgba(166, 115, 255, 0.4)',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'scale(1)' : 'scale(0)',
            transition: `opacity 0.5s ease ${i * 0.2}s, transform 0.5s ease ${i * 0.2}s`,
          }}
        />
      ))}
      
      {/* Conteúdo do banner */}
      <div className="relative z-10 flex h-full">
        {/* Área de Logo */}
        <div 
          className="w-1/3 flex items-center justify-center p-6"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}
        >
          <div className="relative flex items-center justify-center">
            <div 
              className="absolute inset-0 rounded-xl overflow-hidden"
              style={{
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.5s ease',
              }}
            />
            <div 
              className="relative z-10 bg-[#1a1a1a] rounded-lg p-5"
              style={{
                boxShadow: isHovered 
                  ? '0 8px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset' 
                  : '0 4px 20px rgba(0,0,0,0.3)',
                transition: 'box-shadow 0.5s ease, transform 0.5s ease',
                transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
              }}
            >
              <div className="relative h-[80px] w-[200px]">
                <Image
                  src="/images/sponsors/luckbet.png"
                  alt="LuckyBet"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Área de Conteúdo */}
        <div 
          className="w-2/3 flex flex-col justify-center p-8"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
          }}
        >
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={16} 
                fill="#FFCC29" 
                stroke="none" 
                className="mr-1"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'scale(1)' : 'scale(0)',
                  transition: `all 0.3s ease ${0.4 + i * 0.1}s`,
                }}  
              />
            ))}
            <span 
              className="ml-2 text-gray-300 text-sm"
              style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.5s ease 0.8s',
              }}
            >
              Patrocinador Oficial
            </span>
          </div>
          
          <h3 
            className="text-2xl font-bold mb-3"
            style={{
              background: 'linear-gradient(90deg, #FFFFFF, #DDD6FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
              transition: 'opacity 0.5s ease 0.6s, transform 0.5s ease 0.6s',
            }}
          >
            Apostas exclusivas com as melhores odds
          </h3>
          
          <p 
            className="text-gray-300 mb-5 text-sm max-w-md"
            style={{
              opacity: isVisible ? 0.9 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
              transition: 'opacity 0.5s ease 0.7s, transform 0.5s ease 0.7s',
            }}
          >
            Registre-se hoje na LuckyBet e ganhe um bônus de boas-vindas
          </p>
          
          <div
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
              transition: 'opacity 0.5s ease 0.8s, transform 0.5s ease 0.8s',
            }}
          >
            <a 
              href="https://luck.bet.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full"
              style={{
                background: isHovered 
                  ? 'linear-gradient(90deg, #FFCC29, #FFB800)' 
                  : 'linear-gradient(90deg, #FFCC29, #FFB800)',
                color: '#000',
                boxShadow: isHovered 
                  ? '0 10px 25px rgba(255, 204, 41, 0.35), 0 0 0 2px rgba(255, 204, 41, 0.2) inset'
                  : '0 4px 15px rgba(255, 204, 41, 0.25)',
                transition: 'all 0.3s ease',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              Visite o site
              <ChevronRight size={18} className={`transition-transform duration-300 ${isHovered ? 'translate-x-0.5' : ''}`} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}; 