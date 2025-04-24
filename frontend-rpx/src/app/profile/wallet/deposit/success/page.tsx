'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';

export default function DepositSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  
  // Obter o status do pagamento, se disponível
  const status = searchParams?.get('status') || '';
  const paymentId = searchParams?.get('payment_id') || '';
  const preferenceId = searchParams?.get('preference_id') || '';
  
  // Atualizar dados do usuário para mostrar saldo atualizado
  useEffect(() => {
    if (isAuthenticated) {
      // Dar um tempo para o webhook processar o pagamento
      const timer = setTimeout(() => {
        refreshUser().catch(error => {
          console.error('Erro ao atualizar dados do usuário:', error);
        });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, refreshUser]);
  
  // Redirecionar se não estiver autenticado
  useEffect(() => {
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
          <h1 className="text-2xl font-bold">Depósito Realizado</h1>
        </div>
        
        <div className="bg-card rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="text-green-500" size={64} />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">
              {status === 'approved' ? 'Pagamento Aprovado!' : 'Solicitação Recebida!'}
            </h2>
            
            <p className="text-gray-400 mb-6">
              {status === 'approved' 
                ? 'Seu depósito foi processado com sucesso e o valor já foi adicionado à sua carteira.'
                : 'Sua solicitação de depósito foi recebida. Assim que o pagamento for confirmado, o valor será adicionado à sua carteira.'}
            </p>
            
            {paymentId && (
              <div className="bg-card-hover rounded-md p-4 mb-6 inline-block">
                <p className="text-sm text-gray-400">ID do Pagamento: <span className="text-white">{paymentId}</span></p>
              </div>
            )}
            
            <div className="space-y-4 mt-6">
              <Link 
                href="/profile/wallet" 
                className="btn-primary py-2 px-6 inline-block"
              >
                Voltar para a Carteira
              </Link>
              
              <div>
                <Link 
                  href="/" 
                  className="text-primary hover:underline text-sm block mt-2"
                >
                  Ir para a Página Inicial
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start">
            <div className="mr-3 mt-1 text-blue-400">
              <CheckCircle size={20} />
            </div>
            <div>
              <h3 className="font-medium text-blue-400">O que acontece agora?</h3>
              <ul className="mt-2 text-sm text-gray-300 space-y-1">
                <li>• Seu saldo será atualizado automaticamente na sua carteira</li>
                <li>• Você pode verificar o histórico de transações em sua carteira</li>
                <li>• Em caso de dúvidas ou problemas, entre em contato com o suporte</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 