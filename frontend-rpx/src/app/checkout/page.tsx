"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CreditCard } from "react-feather";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [processingOrder, setProcessingOrder] = useState(false);
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    observations: "",
  });

  useEffect(() => {
    // Carregar carrinho do localStorage
    const savedCart = localStorage.getItem('rpx-cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (parsed.length === 0) {
          // Carrinho vazio, redirecionar para a loja
          router.push("/loja");
          return;
        }
        setCartItems(parsed);
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
        router.push("/loja");
      }
    } else {
      // Sem carrinho, redirecionar para a loja
      router.push("/loja");
    }
    setLoading(false);
  }, [router]);

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const calculateShipping = () => {
    // Simulação de cálculo de frete baseado no valor da compra
    const subtotal = calculateSubtotal();
    if (subtotal > 150) return 0; // Frete grátis para compras acima de R$ 150
    return 15.99; // Valor fixo de frete
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const required = ['name', 'email', 'phone', 'address', 'city', 'state', 'postalCode'];
    return required.every(field => formData[field as keyof typeof formData].trim() !== '');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    
    setProcessingOrder(true);
    
    try {
      // Simulação de processamento de pedido
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Limpar carrinho
      localStorage.removeItem('rpx-cart');
      
      // Redirecionar para página de confirmação
      router.push("/checkout/confirmacao");
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
      alert("Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.");
      setProcessingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-16">
      <div className="mb-6">
        <Link href="/loja" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a loja
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmitOrder}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Informe seus dados para entrega e contato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <Input 
                    id="address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      value={formData.city} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                    <Input 
                      id="state" 
                      name="state" 
                      value={formData.state} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">CEP *</Label>
                    <Input 
                      id="postalCode" 
                      name="postalCode" 
                      value={formData.postalCode} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea 
                    id="observations" 
                    name="observations" 
                    value={formData.observations} 
                    onChange={handleInputChange} 
                    placeholder="Instruções para entrega, referências, etc."
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Forma de Pagamento</CardTitle>
                <CardDescription>Escolha como deseja pagar</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 rounded-md border p-3 mb-3">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex-grow cursor-pointer">PIX</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3 mb-3">
                    <RadioGroupItem value="boleto" id="boleto" />
                    <Label htmlFor="boleto" className="flex-grow cursor-pointer">Boleto Bancário</Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-md border p-3">
                    <RadioGroupItem value="cartao" id="cartao" />
                    <Label htmlFor="cartao" className="flex-grow cursor-pointer">Cartão de Crédito</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <div className="hidden md:block">
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={processingOrder}
              >
                {processingOrder ? "Processando..." : "Finalizar Pedido"}
              </Button>
            </div>
          </form>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between pb-3 border-b">
                    <div className="flex space-x-3">
                      <div className="relative w-16 h-16 rounded overflow-hidden">
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.product.price)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>
                    {calculateShipping() === 0 
                      ? "Grátis" 
                      : formatCurrency(calculateShipping())}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              {calculateShipping() === 0 && (
                <div className="bg-green-50 p-3 rounded-md text-green-700 text-sm flex items-start mt-4">
                  <span className="mr-2 mt-0.5">✓</span>
                  <span>Frete grátis aplicado para compras acima de R$ 150</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="block md:hidden">
              <Button 
                type="button" 
                className="w-full" 
                size="lg"
                onClick={handleSubmitOrder}
                disabled={processingOrder}
              >
                {processingOrder ? "Processando..." : "Finalizar Pedido"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 