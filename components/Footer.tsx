import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-rpx-blue p-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">RPX</h3>
            <p>A melhor plataforma de competições e apostas de Free Fire do Brasil.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li><Link href="/torneios">Torneios</Link></li>
              <li><Link href="/rankings">Rankings</Link></li>
              <li><Link href="/apostas">Apostas</Link></li>
              <li><Link href="/loja">Loja</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Suporte</h3>
            <ul className="space-y-2">
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/contato">Contato</Link></li>
              <li><Link href="/termos">Termos de Uso</Link></li>
              <li><Link href="/privacidade">Política de Privacidade</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Redes Sociais</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-white hover:text-rpx-orange">
                Instagram
              </Link>
              <Link href="#" className="text-white hover:text-rpx-orange">
                Twitter
              </Link>
              <Link href="#" className="text-white hover:text-rpx-orange">
                Discord
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/20 text-center">
          <p>&copy; {new Date().getFullYear()} RPX. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 