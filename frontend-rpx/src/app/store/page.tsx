'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, Tag, Gift, Star, ShoppingCart, Package, X } from 'react-feather';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { CaseOpening } from '@/components/store/CaseOpening';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'skins' | 'boosters' | 'tickets' | 'vip' | 'avatars' | 'banners' | 'effects';
  discountPercentage?: number;
  image: string;
  isNew?: boolean;
  isFeatured?: boolean;
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'cases'>('products');

  // Dados de exemplo para produtos
  const productsData: Product[] = [
    {
      id: "1",
      name: "Moldura Legend",
      description: "Moldura exclusiva do rank Legend para seu perfil.",
      price: 1000,
      category: "banners",
      image: "/images/frames/legend.png",
      isFeatured: true
    },
    {
      id: "2",
      name: "Moldura Challenger",
      description: "Moldura exclusiva do rank Challenger para seu perfil.",
      price: 2000,
      category: "banners",
      image: "/images/frames/challenger.png",
      isNew: true
    },
    {
      id: "3",
      name: "Avatar Personalizado",
      description: "Avatar personalizado para seu perfil.",
      price: 500,
      category: "avatars",
      image: "/images/avatars/custom.png"
    },
    {
      id: "4",
      name: "Efeito de Entrada",
      description: "Efeito especial ao entrar no lobby.",
      price: 800,
      category: "effects",
      image: "/images/effects/entrance.png",
      isNew: true
    },
    {
      id: "5",
      name: "Pacote VIP",
      description: "30 dias de benefícios VIP + moldura exclusiva.",
      price: 1500,
      category: "vip",
      discountPercentage: 15,
      image: "/images/vip/package.png",
      isFeatured: true
    },
    {
      id: "6",
      name: "Pacote de Diamantes",
      description: "1000 diamantes para usar na plataforma.",
      price: 100,
      category: "boosters",
      image: "/images/boosters/diamonds.png"
    },
    {
      id: "7",
      name: "Ticket Torneio Premium",
      description: "Acesso ao torneio premium com premiação garantida.",
      price: 50,
      category: "tickets",
      image: "/images/tickets/premium.png"
    },
    {
      id: "8",
      name: "Moldura Diamond",
      description: "Moldura exclusiva do rank Diamond para seu perfil.",
      price: 800,
      category: "banners",
      image: "/images/frames/diamond.png"
    },
    {
      id: "9",
      name: "Efeito de Vitória",
      description: "Efeito especial ao vencer uma partida.",
      price: 600,
      category: "effects",
      image: "/images/effects/victory.png"
    }
  ];

  useEffect(() => {
    // Usando dados mockados em vez da API
    setTimeout(() => {
      setProducts(productsData);
      setFilteredProducts(productsData);
      setIsLoading(false);
    }, 1000);

    // Comentando chamada à API real
    // const fetchProducts = async () => {
    //   try {
    //     setIsLoading(true);
    //     const response = await fetch('/api/store/products');
    //     if (!response.ok) {
    //       throw new Error('Falha ao buscar produtos da API');
    //     }
    //     const data = await response.json();
    //     if (data && data.products) {
    //       setProducts(data.products);
    //       setFilteredProducts(data.products);
    //     } else {
    //       console.error('Formato de resposta da API inválido:', data);
    //       setError('Formato de resposta da API inválido');
    //     }
    //     setIsLoading(false);
    //   } catch (err) {
    //     console.error('Erro ao carregar produtos da loja:', err);
    //     setError('Não foi possível carregar os produtos. Tente novamente mais tarde.');
    //     setIsLoading(false);
    //   }
    // };
    // fetchProducts();
  }, []);

  // Filtrar produtos
  useEffect(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const calculateDiscountedPrice = (price: number, discountPercentage?: number) => {
    if (!discountPercentage) return price;
    return price - (price * discountPercentage / 100);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-700 text-white rounded hover:bg-purple-800"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Loja</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button 
            className={`py-3 px-6 font-medium relative ${activeTab === 'products' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('products')}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              <span>Produtos</span>
            </div>
            {activeTab === 'products' && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                layoutId="activeTabIndicator"
              />
            )}
          </button>
          <button 
            className={`py-3 px-6 font-medium relative ${activeTab === 'cases' ? 'text-white' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('cases')}
          >
            <div className="flex items-center gap-2">
              <Package size={18} />
              <span>Caixas</span>
            </div>
            {activeTab === 'cases' && (
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
                layoutId="activeTabIndicator"
              />
            )}
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          {activeTab === 'products' ? (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div className="flex gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <input
                      type="text"
                      placeholder="Buscar produtos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-card-bg border border-gray-700 focus:outline-none focus:border-purple-500"
                    />
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="px-4 py-2 rounded-lg bg-card-bg border border-gray-700 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Filter size={20} />
                    <span className="hidden md:inline">Filtrar</span>
                  </button>
                </div>
              </div>

              {isFilterOpen && (
                <div className="mb-8 p-4 bg-card-bg rounded-lg border border-gray-700 shadow-lg">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2 rounded ${
                        selectedCategory === null 
                          ? 'bg-purple-700 text-white' 
                          : 'bg-background hover:bg-gray-800'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setSelectedCategory('skins')}
                      className={`px-4 py-2 rounded ${
                        selectedCategory === 'skins' 
                          ? 'bg-purple-700 text-white' 
                          : 'bg-background hover:bg-gray-800'
                      }`}
                    >
                      Skins
                    </button>
                    <button
                      onClick={() => setSelectedCategory('boosters')}
                      className={`px-4 py-2 rounded ${
                        selectedCategory === 'boosters' 
                          ? 'bg-purple-700 text-white' 
                          : 'bg-background hover:bg-gray-800'
                      }`}
                    >
                      Boosters
                    </button>
                    <button
                      onClick={() => setSelectedCategory('tickets')}
                      className={`px-4 py-2 rounded ${
                        selectedCategory === 'tickets' 
                          ? 'bg-purple-700 text-white' 
                          : 'bg-background hover:bg-gray-800'
                      }`}
                    >
                      Tickets
                    </button>
                    <button
                      onClick={() => setSelectedCategory('vip')}
                      className={`px-4 py-2 rounded ${
                        selectedCategory === 'vip' 
                          ? 'bg-purple-700 text-white' 
                          : 'bg-background hover:bg-gray-800'
                      }`}
                    >
                      VIP
                    </button>
                  </div>
                </div>
              )}

              {/* Featured Products */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6">Produtos em <span className="text-purple-500">Destaque</span></h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.filter(p => p.isFeatured).map(product => (
                    <div key={product.id} className="bg-card-bg rounded-xl shadow-lg overflow-hidden border border-gray-700 hover:border-purple-600/30 transition-colors">
                      <div className="h-48 bg-background relative">
                        <div className="absolute inset-0 flex items-center justify-center text-purple-400">
                          <Gift size={64} />
                        </div>
                        {product.discountPercentage && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            -{product.discountPercentage}%
                          </div>
                        )}
                        {product.isNew && (
                          <div className="absolute top-2 left-2 bg-purple-700 text-white text-xs px-2 py-1 rounded-full">
                            Novo
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                        <p className="text-gray-300 text-sm mb-4">{product.description}</p>
                        <div className="flex justify-between items-center">
                          {product.discountPercentage ? (
                            <div>
                              <span className="text-gray-400 line-through text-sm mr-2">
                                {formatCurrency(product.price)}
                              </span>
                              <span className="text-purple-400 font-bold">
                                {formatCurrency(calculateDiscountedPrice(product.price, product.discountPercentage))}
                              </span>
                            </div>
                          ) : (
                            <span className="text-purple-400 font-bold">{formatCurrency(product.price)}</span>
                          )}
                          <button className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-full text-sm">
                            Comprar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Products */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Todos os <span className="text-purple-500">Produtos</span></h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="bg-card-bg rounded-xl shadow-sm overflow-hidden border border-gray-700 hover:border-purple-600/30 transition-colors">
                      <div className="h-40 bg-background relative flex items-center justify-center">
                        <div className="text-purple-400">
                          {product.category === 'skins' && <Tag size={40} />}
                          {product.category === 'boosters' && <DollarSign size={40} />}
                          {product.category === 'tickets' && <Gift size={40} />}
                          {product.category === 'vip' && <Star size={40} />}
                        </div>
                        {product.discountPercentage && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            -{product.discountPercentage}%
                          </div>
                        )}
                        {product.isNew && (
                          <div className="absolute top-2 left-2 bg-purple-700 text-white text-xs px-2 py-1 rounded-full">
                            Novo
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold mb-1">{product.name}</h3>
                        <p className="text-gray-300 text-xs mb-3 line-clamp-2">{product.description}</p>
                        <div className="flex justify-between items-center">
                          {product.discountPercentage ? (
                            <div>
                              <span className="text-gray-400 line-through text-xs mr-2">
                                {formatCurrency(product.price)}
                              </span>
                              <span className="text-purple-400 font-bold text-sm">
                                {formatCurrency(calculateDiscountedPrice(product.price, product.discountPercentage))}
                              </span>
                            </div>
                          ) : (
                            <span className="text-purple-400 font-bold text-sm">{formatCurrency(product.price)}</span>
                          )}
                          <button className="px-2 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs">
                            Comprar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="cases"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CaseOpening />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
} 