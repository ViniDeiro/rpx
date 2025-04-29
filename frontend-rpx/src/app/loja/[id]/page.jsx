"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export default function DetalheProdutoPage({ params }) {
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    async function loadProduto() {
      try {
        setLoading(true);
        const response = await fetch(`/api/store/products?id=${params.id}`);
        
        if (!response.ok) {
          throw new Error('Produto não encontrado');
        }
        
        const data = await response.json();
        
        setProduto({
          id: data._id,
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          imageUrl: data.imageUrl || '/placeholder.png',
          inStock: data.inStock,
          featured: data.featured,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      } catch (err) {
        console.error('Erro ao carregar produto:', err);
        setError('Não foi possível carregar o produto');
      } finally {
        setLoading(false);
      }
    }
    
    loadProduto();
  }, [params.id]);

  const addToCart = () => {
    if (!produto) return;
    
    // Buscar carrinho atual do localStorage
    const savedCart = localStorage.getItem('rpx-cart');
    let cartItems = [];
    
    if (savedCart) {
      try {
        cartItems = JSON.parse(savedCart);
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
      }
    }
    
    // Verificar se o produto já está no carrinho
    const existingItemIndex = cartItems.findIndex(item => item.product.id === produto.id);
    
    if (existingItemIndex >= 0) {
      // Atualizar quantidade se já existe
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      // Adicionar novo item se não existe
      cartItems.push({
        product: produto,
        quantity: quantity
      });
    }
    
    // Salvar no localStorage
    localStorage.setItem('rpx-cart', JSON.stringify(cartItems));
    
    // Feedback para o usuário
    alert('Produto adicionado ao carrinho!');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !produto) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Erro</h1>
          <p className="text-muted-foreground mb-6">{error || 'Produto não encontrado'}</p>
          <Button asChild>
            <Link href="/loja">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a loja
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/loja">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a loja
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Imagem do produto */}
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
          <Image
            src={produto.imageUrl}
            alt={produto.name}
            fill
            className="object-cover"
          />
          {produto.featured && (
            <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm">
              Destaque
            </div>
          )}
          {!produto.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <span className="text-white font-bold text-xl">Esgotado</span>
            </div>
          )}
        </div>
        
        {/* Informações do produto */}
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{produto.name}</h1>
            <p className="text-2xl font-bold text-primary mb-4">
              {formatCurrency(produto.price)}
            </p>
            
            <div className="prose mb-6">
              <p>{produto.description}</p>
            </div>
            
            <div className="mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                Categoria: {produto.category}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {produto.inStock ? (
              <>
                <div className="flex items-center">
                  <span className="mr-4">Quantidade:</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                
                <Button 
                  className="w-full flex items-center justify-center" 
                  onClick={addToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Adicionar ao Carrinho
                </Button>
              </>
            ) : (
              <Button disabled className="w-full">
                Produto Indisponível
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 