'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GitHub, Instagram, Twitter, Youtube } from 'react-feather';
import ImagePaths from '@/utils/image-paths';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'Navegação',
      links: [
        { label: 'Início', href: '/' },
        { label: 'Partidas', href: '/matches' },
        { label: 'Torneios', href: '/tournaments' },
        { label: 'Rankings', href: '/ranking' },
        { label: 'Loja', href: '/store' },
      ],
    },
    {
      title: 'Informações',
      links: [
        { label: 'Sobre nós', href: '/about' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Termos de Uso', href: '/terms' },
        { label: 'Privacidade', href: '/privacy' },
        { label: 'Contato', href: '/contact' },
      ],
    },
    {
      title: 'Jogo Responsável',
      links: [
        { label: 'Limites de Depósito', href: '/responsible-gaming/deposit-limits' },
        { label: 'Auto-Exclusão', href: '/responsible-gaming/self-exclusion' },
        { label: 'Verificação de Idade', href: '/responsible-gaming/age-verification' },
        { label: 'Ajuda e Suporte', href: '/support' },
      ],
    },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/rpx', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/rpx', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/rpx', label: 'YouTube' },
    { icon: GitHub, href: 'https://github.com/rpx', label: 'GitHub' },
  ];
  
  return (
    <footer className="bg-gradient-to-b from-background to-card-bg border-t border-primary/10 pt-12 pb-6 relative">
      <div className="absolute inset-0 bg-rpx-gradient-radial opacity-[0.02] pointer-events-none"></div>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo e slogan */}
          <div>
            <div className="mb-3">
                <Image
                src={ImagePaths.logo} 
                alt="RPX Logo"
                width={120}
                height={50}
                className="mb-2"
                />
            </div>
            <p className="text-muted mb-4">
              A melhor plataforma de apostas competitivas para Free Fire no Brasil
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-card-hover text-foreground hover:bg-primary hover:text-white transition-all hover:shadow-rpx"
                    aria-label={social.label}
                  >
                    <Icon size={18} className="group-hover:text-white" />
                  </a>
                );
              })}
            </div>
          </div>
          
          {/* Links de navegação */}
          {footerLinks.map((section) => (
            <div key={section.title} className="relative">
              <h3 className="font-semibold text-lg mb-4 relative inline-block">
                {section.title}
                <div className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-primary/80 to-transparent"></div>
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-muted hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Informações legais */}
        <div className="border-t border-border/50 pt-6 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted mb-4 md:mb-0">
              &copy; {currentYear} RPX. Todos os direitos reservados.
            </div>
            <div className="text-xs text-muted text-center md:text-right">
              <p className="mb-1">
                Jogue com responsabilidade. Apostas disponíveis apenas para maiores de 18 anos.
              </p>
              <p>
                RPX é uma plataforma de apostas fictícia criada apenas para fins de demonstração.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}; 