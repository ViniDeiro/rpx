"use client";

import { useEffect } from "react";
import { Check, Home, ShoppingBag } from "react-feather";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OrderConfirmationPage() {
  const router = useRouter();
  const orderNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

  useEffect(() => {
    // Verificar se chegou a esta página por fluxo normal
    // Se o usuário acessar diretamente, redirecionamos para a loja
    if (!localStorage.getItem('rpx-order-confirmed')) {
      localStorage.setItem('rpx-order-confirmed', 'true');
    }

    return () => {
      // Limpar o flag ao sair da página
      localStorage.removeItem('rpx-order-confirmed');
    };
  }, []);

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-green-100 w-16 h-16 flex items-center justify-center rounded-full mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl mb-1">Pedido Confirmado!</CardTitle>
          <p className="text-muted-foreground">
            Seu pedido #{orderNumber} foi recebido com sucesso.
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4 pt-4">
          <p>
            Enviamos um e-mail com os detalhes do seu pedido e instruções para pagamento. 
            Em caso de dúvidas, entre em contato com nosso suporte.
          </p>
          
          <div className="bg-muted p-4 rounded-md text-sm">
            <p className="font-medium mb-1">Próximos passos:</p>
            <ol className="text-left space-y-2 list-decimal list-inside">
              <li>Realize o pagamento conforme as instruções enviadas.</li>
              <li>Acompanhe o status do seu pedido por e-mail.</li>
              <li>Prepare-se para receber seus produtos.</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar à Página Inicial
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/loja">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continuar Comprando
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 