import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface Item {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  tipo: 'lootbox' | 'skin' | 'boost' | 'vip' | 'emoticon';
  raridade: 'comum' | 'raro' | 'épico' | 'lendário';
  img: string;
  promocao?: number;
  destaque?: boolean;
  novo?: boolean;
}

const itens: Item[] = [
  {
    id: 'item-001',
    nome: 'Lootbox Lendário',
    descricao: 'Possui chance de 15% de obter itens lendários e 100% de obter ao menos um item épico.',
    preco: 1000,
    tipo: 'lootbox',
    raridade: 'lendário',
    img: '/items/lootbox-legendary.jpg',
    destaque: true
  },
  {
    id: 'item-002',
    nome: 'Lootbox Épico',
    descricao: 'Possui chance de 40% de obter itens épicos e 100% de obter ao menos um item raro.',
    preco: 500,
    tipo: 'lootbox',
    raridade: 'épico',
    img: '/items/lootbox-epic.jpg'
  },
  {
    id: 'item-003',
    nome: 'Lootbox Raro',
    descricao: 'Possui chance de 70% de obter itens raros.',
    preco: 250,
    tipo: 'lootbox',
    raridade: 'raro',
    img: '/items/lootbox-rare.jpg',
    promocao: 200
  },
  {
    id: 'item-004',
    nome: 'Lootbox Comum',
    descricao: 'Contém itens comuns com 10% de chance de obter um item raro.',
    preco: 100,
    tipo: 'lootbox',
    raridade: 'comum',
    img: '/items/lootbox-common.jpg'
  },
  {
    id: 'item-005',
    nome: 'Pacote VIP Bronze',
    descricao: 'Acesso a torneios exclusivos e 10% de bônus em premiações por 30 dias.',
    preco: 1500,
    tipo: 'vip',
    raridade: 'raro',
    img: '/items/vip-bronze.jpg'
  },
  {
    id: 'item-006',
    nome: 'Pacote VIP Prata',
    descricao: 'Acesso a torneios exclusivos e 20% de bônus em premiações por 30 dias.',
    preco: 3000,
    tipo: 'vip',
    raridade: 'épico',
    img: '/items/vip-silver.jpg',
    promocao: 2400
  },
  {
    id: 'item-007',
    nome: 'Pacote VIP Ouro',
    descricao: 'Acesso a torneios exclusivos e 35% de bônus em premiações por 30 dias.',
    preco: 5000,
    tipo: 'vip',
    raridade: 'lendário',
    img: '/items/vip-gold.jpg',
    destaque: true
  },
  {
    id: 'item-008',
    nome: 'Boost de Experiência (7 dias)',
    descricao: 'Ganhe 50% mais experiência em todos os torneios durante 7 dias.',
    preco: 800,
    tipo: 'boost',
    raridade: 'raro',
    img: '/items/xp-boost.jpg'
  },
  {
    id: 'item-009',
    nome: 'Avatar Premium "Dragão"',
    descricao: 'Avatar exclusivo para seu perfil na plataforma RPX.',
    preco: 350,
    tipo: 'skin',
    raridade: 'épico',
    img: '/items/avatar-dragon.jpg',
    novo: true
  },
  {
    id: 'item-010',
    nome: 'Conjunto de Emoticons "Pro Player"',
    descricao: 'Um conjunto de 5 emoticons exclusivos para usar durante os torneios.',
    preco: 450,
    tipo: 'emoticon',
    raridade: 'raro',
    img: '/items/emoticons-pack.jpg'
  }
];

type TipoItem = 'todos' | 'lootbox' | 'skin' | 'boost' | 'vip' | 'emoticon';
type Raridade = 'todos' | 'comum' | 'raro' | 'épico' | 'lendário';

const LojaPage: React.FC = () => {
  const [tipoFiltro, setTipoFiltro] = useState<TipoItem>('todos');
  const [raridadeFiltro, setRaridadeFiltro] = useState<Raridade>('todos');
  const [ordenarPor, setOrdenarPor] = useState<string>('destaque');
  
  const itensFiltrados = itens
    .filter(item => tipoFiltro === 'todos' || item.tipo === tipoFiltro)
    .filter(item => raridadeFiltro === 'todos' || item.raridade === raridadeFiltro)
    .sort((a, b) => {
      if (ordenarPor === 'destaque') {
        // Primeiro itens em destaque, depois itens novos, depois promoções
        if (a.destaque && !b.destaque) return -1;
        if (!a.destaque && b.destaque) return 1;
        if (a.novo && !b.novo) return -1;
        if (!a.novo && b.novo) return 1;
        if (a.promocao && !b.promocao) return -1;
        if (!a.promocao && b.promocao) return 1;
        return 0;
      }
      if (ordenarPor === 'preco-asc') {
        return (a.promocao || a.preco) - (b.promocao || b.preco);
      }
      if (ordenarPor === 'preco-desc') {
        return (b.promocao || b.preco) - (a.promocao || a.preco);
      }
      if (ordenarPor === 'raridade') {
        const raridadeValor = { 'comum': 1, 'raro': 2, 'épico': 3, 'lendário': 4 };
        return raridadeValor[b.raridade] - raridadeValor[a.raridade];
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-rpx-dark text-rpx-light">
      <Head>
        <title>Loja | RPX - Plataforma de Competições e Apostas de Free Fire</title>
        <meta name="description" content="Loja virtual da plataforma RPX com lootboxes, itens e pacotes VIP" />
      </Head>

      <Header />

      <main className="py-10">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 font-heading">Loja RPX</h1>
          
          <div className="bg-rpx-blue/20 rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <button 
                  className={`px-4 py-2 rounded ${tipoFiltro === 'todos' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setTipoFiltro('todos')}
                >
                  Todos
                </button>
                <button 
                  className={`px-4 py-2 rounded ${tipoFiltro === 'lootbox' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setTipoFiltro('lootbox')}
                >
                  Lootboxes
                </button>
                <button 
                  className={`px-4 py-2 rounded ${tipoFiltro === 'vip' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setTipoFiltro('vip')}
                >
                  Pacotes VIP
                </button>
                <button 
                  className={`px-4 py-2 rounded ${tipoFiltro === 'boost' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setTipoFiltro('boost')}
                >
                  Boosts
                </button>
                <button 
                  className={`px-4 py-2 rounded ${tipoFiltro === 'skin' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setTipoFiltro('skin')}
                >
                  Skins
                </button>
                <button 
                  className={`px-4 py-2 rounded ${tipoFiltro === 'emoticon' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setTipoFiltro('emoticon')}
                >
                  Emoticons
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span>Ordenar por:</span>
                <select 
                  className="bg-rpx-blue/40 border border-white/20 rounded p-2"
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                >
                  <option value="destaque">Destaques</option>
                  <option value="preco-asc">Preço (menor → maior)</option>
                  <option value="preco-desc">Preço (maior → menor)</option>
                  <option value="raridade">Raridade</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm mb-2">Filtrar por raridade:</div>
              <div className="flex flex-wrap gap-2">
                <button 
                  className={`px-3 py-1 rounded text-sm ${raridadeFiltro === 'todos' ? 'bg-rpx-orange text-white' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setRaridadeFiltro('todos')}
                >
                  Todos
                </button>
                <button 
                  className={`px-3 py-1 rounded text-sm ${raridadeFiltro === 'comum' ? 'bg-gray-500 text-white' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setRaridadeFiltro('comum')}
                >
                  Comum
                </button>
                <button 
                  className={`px-3 py-1 rounded text-sm ${raridadeFiltro === 'raro' ? 'bg-blue-500 text-white' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setRaridadeFiltro('raro')}
                >
                  Raro
                </button>
                <button 
                  className={`px-3 py-1 rounded text-sm ${raridadeFiltro === 'épico' ? 'bg-purple-500 text-white' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setRaridadeFiltro('épico')}
                >
                  Épico
                </button>
                <button 
                  className={`px-3 py-1 rounded text-sm ${raridadeFiltro === 'lendário' ? 'bg-yellow-500 text-black' : 'bg-rpx-blue/30 text-white'}`}
                  onClick={() => setRaridadeFiltro('lendário')}
                >
                  Lendário
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {itensFiltrados.map((item) => (
              <div 
                key={item.id} 
                className={`bg-rpx-blue/20 rounded-lg overflow-hidden ${
                  item.destaque ? 'ring-2 ring-yellow-500' : ''
                }`}
              >
                <div className="h-48 bg-rpx-blue/40 relative">
                  {/* Placeholder para imagem */}
                  <div className="w-full h-full flex items-center justify-center">
                    <div className={`text-4xl ${
                      item.raridade === 'comum' ? 'text-gray-400' :
                      item.raridade === 'raro' ? 'text-blue-400' :
                      item.raridade === 'épico' ? 'text-purple-400' :
                      'text-yellow-400'
                    }`}>
                      {item.tipo === 'lootbox' ? '📦' : 
                       item.tipo === 'vip' ? '👑' :
                       item.tipo === 'boost' ? '🚀' :
                       item.tipo === 'skin' ? '👤' : '😀'}
                    </div>
                  </div>
                  
                  {/* Emblema de raridade */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                    item.raridade === 'comum' ? 'bg-gray-500 text-white' :
                    item.raridade === 'raro' ? 'bg-blue-500 text-white' :
                    item.raridade === 'épico' ? 'bg-purple-500 text-white' :
                    'bg-yellow-500 text-black'
                  }`}>
                    {item.raridade.toUpperCase()}
                  </div>
                  
                  {/* Emblema de novo */}
                  {item.novo && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white rounded text-xs font-bold">
                      NOVO
                    </div>
                  )}
                  
                  {/* Emblema de destaque */}
                  {item.destaque && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-yellow-500 text-black rounded text-xs font-bold">
                      DESTAQUE
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h2 className="text-xl font-bold mb-2">{item.nome}</h2>
                  <p className="text-white/70 text-sm mb-4">{item.descricao}</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      {item.promocao ? (
                        <div>
                          <span className="text-white/50 line-through text-sm mr-2">{item.preco} RPX</span>
                          <span className="text-rpx-orange font-bold">{item.promocao} RPX</span>
                        </div>
                      ) : (
                        <span className="font-bold">{item.preco} RPX</span>
                      )}
                    </div>
                    <Link 
                      href={`/loja/item/${item.id}`}
                      className="px-3 py-1 bg-rpx-orange text-white rounded hover:bg-orange-700"
                    >
                      Comprar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {itensFiltrados.length === 0 && (
            <div className="text-center py-12 bg-rpx-blue/20 rounded-lg">
              <p className="text-2xl">Nenhum item encontrado com os filtros selecionados.</p>
              <button 
                className="mt-4 px-4 py-2 bg-rpx-orange text-white rounded"
                onClick={() => {
                  setTipoFiltro('todos');
                  setRaridadeFiltro('todos');
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}
          
          <div className="mt-12 bg-rpx-blue/20 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 font-heading">Como funciona a Loja RPX</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-rpx-blue/30 p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="w-8 h-8 bg-rpx-orange rounded-full flex items-center justify-center mr-2">1</span>
                  Compre Coins
                </h3>
                <p className="text-white/80">
                  Adquira Coins RPX para utilizar na plataforma. Quanto mais coins você comprar, maior o bônus recebido.
                </p>
              </div>
              <div className="bg-rpx-blue/30 p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="w-8 h-8 bg-rpx-orange rounded-full flex items-center justify-center mr-2">2</span>
                  Escolha Seus Itens
                </h3>
                <p className="text-white/80">
                  Use seus Coins para adquirir Lootboxes, pacotes VIP e outros itens exclusivos da plataforma.
                </p>
              </div>
              <div className="bg-rpx-blue/30 p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-2 flex items-center">
                  <span className="w-8 h-8 bg-rpx-orange rounded-full flex items-center justify-center mr-2">3</span>
                  Receba Vantagens
                </h3>
                <p className="text-white/80">
                  Aproveite os benefícios dos itens para melhorar sua experiência nos torneios e competições.
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link href="/loja/coins" className="px-6 py-3 bg-rpx-orange text-white rounded-lg font-bold text-lg inline-block">
                Comprar Coins RPX
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LojaPage; 