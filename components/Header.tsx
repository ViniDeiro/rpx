import React from 'react';
import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <header className="bg-rpx-blue p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading">RPX</h1>
        <nav>
          <ul className="flex space-x-4">
            <li><Link href="/torneios" className="hover:text-rpx-orange">Torneios</Link></li>
            <li><Link href="/rankings" className="hover:text-rpx-orange">Rankings</Link></li>
            <li><Link href="/apostas" className="hover:text-rpx-orange">Apostas</Link></li>
            <li><Link href="/loja" className="hover:text-rpx-orange">Loja</Link></li>
          </ul>
        </nav>
        <div className="flex space-x-2">
          <Link href="/login" className="px-4 py-2 border border-rpx-orange text-rpx-orange rounded hover:bg-rpx-orange hover:text-white">
            Login
          </Link>
          <Link href="/cadastro" className="px-4 py-2 bg-rpx-orange text-white rounded hover:bg-orange-700">
            Cadastre-se
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header; 