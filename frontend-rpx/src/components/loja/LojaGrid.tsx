"use client";

import { useEffect, useState } from "react";
import { Search, ShoppingCart } from "react-feather";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function LojaGrid() {
  const [activeTab, setActiveTab] = useState("todos");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Carregar produtos e categorias
  const loadData = async () => {
    setLoading(true);
    
    try {
      console.log('Carregando produtos da loja pública...');
      
      // Buscar produtos com endpoint público
      const responseProducts = await fetch('/api/store/products');
      
      if (!responseProducts.ok) {
        throw new Error('Falha ao buscar produtos da loja');
      }
      
      const productsData = await responseProducts.json();
      console.log(`Produtos recebidos: ${productsData.products?.length || 0}`);
      
      // Transformar os produtos para o formato esperado
      const formattedProducts = productsData.products?.map((product: any) => ({
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        imageUrl: product.imageUrl || '/placeholder.png',
        inStock: product.inStock,
        featured: product.featured,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      })) || [];
      
      // Buscar categorias com endpoint público
      const responseCategories = await fetch('/api/store/categories');
      
      if (!responseCategories.ok) {
        throw new Error('Falha ao buscar categorias da loja');
      }
      
      const categoriesData = await responseCategories.json();
      
      setProducts(formattedProducts);
      setCategories(categoriesData.categories || []);
      setFilteredProducts(formattedProducts);
    } catch (error) {
      console.error('Erro ao carregar dados da loja:', error);
      
      // Usar arrays vazios em caso de erro
      setProducts([]);
      setCategories([]);
      setFilteredProducts([]);
      
      // Mostrar mensagem de erro para o usuário
      alert('Não foi possível carregar os produtos. Por favor, tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Carregar carrinho do localStorage
    const savedCart = localStorage.getItem('rpx-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
      }
    }
  }, []);

  // Filtrar produtos por termo de busca e categoria
  useEffect(() => {
    let filtered = products;
    
    // Filtrar por categoria
    if (activeTab !== "todos" && activeTab !== "destaque") {
      filtered = filtered.filter((product) => product.category === activeTab);
    } else if (activeTab === "destaque") {
      filtered = filtered.filter((product) => product.featured);
    }
    
    // Filtrar por termo de busca
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchTerm, activeTab, products]);

  // Salvar carrinho no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('rpx-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Funções do carrinho
  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevItems, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => 
      prevItems.filter((item) => item.product.id !== productId)
    );
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const cartItemCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  // Componente do carrinho
  const CartComponent = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-background w-full max-w-md h-full overflow-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Carrinho</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCart(false)}
          >
            ✕
          </Button>
        </div>

        {cartItems.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Seu carrinho está vazio</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowCart(false)}
            >
              Continuar Comprando
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-4">
              {cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between items-center border-b pb-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16 rounded overflow-hidden">
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between mb-4">
                <span className="font-medium">Total</span>
                <span className="font-bold">{formatCurrency(calculateTotal())}</span>
              </div>
              <Button className="w-full" asChild>
                <Link href="/checkout">Finalizar Compra</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="relative md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline"
          className="relative"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartItemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 px-1 py-0 min-w-[20px] h-5 flex items-center justify-center">
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="w-full flex overflow-auto">
          <TabsTrigger value="todos" className="flex-1">Todos</TabsTrigger>
          <TabsTrigger value="destaque" className="flex-1">Destaque</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex-1">
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="text-center py-8">Carregando produtos...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg text-muted-foreground">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col">
              <Link href={`/loja/${product.id}`} className="relative aspect-square">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Esgotado</span>
                  </div>
                )}
                {product.featured && (
                  <Badge className="absolute top-2 right-2">Destaque</Badge>
                )}
              </Link>
              <CardHeader>
                <Link href={`/loja/${product.id}`} className="hover:underline">
                  <CardTitle>{product.name}</CardTitle>
                </Link>
                <CardDescription>
                  {formatCurrency(product.price)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              </CardContent>
              <CardFooter className="mt-auto">
                <div className="w-full flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link href={`/loja/${product.id}`}>
                      Ver Detalhes
                    </Link>
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!product.inStock}
                    onClick={() => product.inStock && addToCart(product)}
                  >
                    {product.inStock ? "Adicionar" : "Indisponível"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {showCart && <CartComponent />}
    </>
  );
} 