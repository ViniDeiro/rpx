'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';

// Componente que usa o hook useSearchParams
function DepositFailureContent() {
  const searchParams = useSearchParams();
  
  // Obter o status do pagamento, se disponível
  const status = searchParams?.get('status') || '';
  const paymentId = searchParams?.get('payment_id') || '';
  const errorMessage = searchParams?.get('error') || 'Ocorreu um erro durante o processamento do pagamento.';
  
  return (
    <>
      <div className="bg-card rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <AlertCircle className="text-red-500" size={64} />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">
            Não foi possível processar o pagamento
          </h2>
          
          <p className="text-gray-400 mb-6">
            {errorMessage}
          </p>
          
          {paymentId && (
            <div className="bg-card-hover rounded-md p-4 mb-6 inline-block">
              <p className="text-sm text-gray-400">ID do Pagamento: <span className="text-white">{paymentId}</span></p>
            </div>
          )}
          
          <div className="space-y-4 mt-6">
            <Link 
              href="/profile/wallet/deposit" 
              className="btn-primary py-2 px-6 inline-block"
            >
              Tentar Novamente
            </Link>
            
            <div>
              <Link 
                href="/profile/wallet" 
                className="text-primary hover:underline text-sm block mt-2"
              >
                Voltar para a Carteira
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-start">
          <div className="mr-3 mt-1 text-red-400">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="font-medium text-red-400">O que fazer agora?</h3>
            <ul className="mt-2 text-sm text-gray-300 space-y-1">
              <li>• Verifique os dados do seu cartão ou método de pagamento</li>
              <li>• Tente novamente com outro método de pagamento</li>
              <li>• Se o problema persistir, entre em contato com o suporte</li>
              <li>• Nenhum valor foi debitado da sua conta</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

// Fallback para o Suspense
function DepositFailureFallback() {
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden mb-6 p-8 text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h2 className="text-2xl font-bold mb-2">Carregando informações...</h2>
    </div>
  );
}

// Componente principal da página
export default function DepositFailurePage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  
  // Redirecionar se não estiver autenticado
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/profile/wallet');
    }
  }, [isLoading, isAuthenticated, router]);
  
  if (isLoading || !isAuthenticated) {
    return (
      <div className="container py-16">
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center">
          <Link href="/profile/wallet" className="mr-4 flex items-center text-muted hover:text-white transition-colors">
            <ArrowLeft size={18} className="mr-1" />
            Voltar à Carteira
          </Link>
          <h1 className="text-2xl font-bold">Falha no Depósito</h1>
        </div>
        
        <Suspense fallback={<DepositFailureFallback />}>
          <DepositFailureContent />
        </Suspense>
      </div>
    </div>
  );
} 