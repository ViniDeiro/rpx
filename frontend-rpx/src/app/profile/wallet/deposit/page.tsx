'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, CreditCard, ArrowLeft, AlertTriangle } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';

// Opções de pagamento
const paymentMethods = [
  { id: 'pix', name: 'PIX', icon: '/images/payment/pix.svg' },
  { id: 'credit_card', name: 'Cartão de Crédito', icon: '/images/payment/credit_card.svg' },
];

// Valores pré-definidos
const depositValues = [
  { value: 20, label: 'R$ 20,00' },
  { value: 50, label: 'R$ 50,00' },
  { value: 100, label: 'R$ 100,00' },
  { value: 200, label: 'R$ 200,00' },
];

export default function DepositPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [amount, setAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manipulador para valor personalizado
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setCustomAmount(value);
    if (value) {
      setAmount(parseInt(value, 10));
    } else {
      setAmount(0);
    }
  };

  // Formatar o valor como moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Processar depósito
  const handleDeposit = async () => {
    if (amount <= 0) {
      setError('Por favor, selecione um valor válido');
      return;
    }

    if (amount < 10) {
      setError('O valor mínimo para depósito é R$ 10,00');
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentMethod,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar depósito');
      }
      
      const data = await response.json();
      
      // Se tiver URL de redirecionamento, redirecionar para a página do Mercado Pago
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      
      // Redirecionar para página de sucesso
      router.push('/profile/wallet/deposit/success');
    } catch (error: any) {
      console.error('Erro ao processar depósito:', error);
      setError(error.message || 'Ocorreu um erro ao processar seu depósito. Tente novamente mais tarde.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-16">
        <div className="flex justify-center items-center py-20">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/auth/login?redirect=/profile/wallet/deposit');
    return null;
  }

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center">
          <Link href="/profile/wallet" className="mr-4 flex items-center text-muted hover:text-white transition-colors">
            <ArrowLeft size={18} className="mr-1" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold">Depositar Saldo</h1>
        </div>

        <div className="bg-card rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="bg-card-hover rounded-md p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-muted">Seu saldo atual:</span>
                <span className="font-bold text-xl text-primary">{formatCurrency(user?.balance || 0)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-md p-4 mb-6 flex items-start">
                <AlertTriangle className="text-red-400 mr-3 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <h2 className="font-bold mb-4">Escolha o valor para depósito</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {depositValues.map((item) => (
                <button
                  key={item.value}
                  className={`py-3 px-4 rounded-md transition-colors ${
                    amount === item.value
                      ? 'bg-primary text-white'
                      : 'bg-card-hover text-white hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    setAmount(item.value);
                    setCustomAmount('');
                  }}
                >
                  {item.label}
                </button>
              ))}
              
              <div className={`py-2 px-4 rounded-md transition-colors ${
                !depositValues.some(wv => wv.value === amount)
                  ? 'ring-2 ring-primary bg-card-hover'
                  : 'bg-card-hover'
              }`}>
                <label className="text-xs text-muted block mb-1">Valor personalizado</label>
                <div className="flex items-center">
                  <span className="text-muted mr-1">R$</span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className="bg-transparent border-none outline-none flex-1 w-full"
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>

            <h2 className="font-bold mb-4">Forma de pagamento</h2>
            
            <div className="space-y-3 mb-6">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 rounded-md flex items-center cursor-pointer transition-colors ${
                    paymentMethod === method.id
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-card-hover hover:bg-gray-700 border border-transparent'
                  }`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <div className="w-10 h-10 flex items-center justify-center mr-4">
                    {method.icon ? (
                      <img src={method.icon} alt={method.name} className="w-6 h-6 object-contain" />
                    ) : (
                      <CreditCard size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{method.name}</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                    {paymentMethod === method.id && (
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card-hover rounded-md p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-muted">Valor do depósito:</span>
                <span className="font-bold text-xl">{formatCurrency(amount)}</span>
              </div>
            </div>

            <button
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              onClick={handleDeposit}
              disabled={isProcessing || amount <= 0}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <DollarSign size={18} />
                  <span>Realizar Depósito</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start">
            <div className="mr-3 mt-1 text-blue-400">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="font-medium text-blue-400">Informações de depósito:</h3>
              <ul className="mt-2 text-sm text-gray-300 space-y-1">
                <li>• O valor mínimo para depósito é de R$ 10,00</li>
                <li>• Depósitos via PIX são processados imediatamente</li>
                <li>• Depósitos com cartão podem levar até 1 hora para serem processados</li>
                <li>• Você será redirecionado para a página de pagamento após confirmar</li>
                <li>• Em caso de problemas, entre em contato com o suporte</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 