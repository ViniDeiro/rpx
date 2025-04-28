'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, TrendingDown, ArrowLeft, AlertTriangle } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// Métodos de saque
const withdrawalMethods = [
  { id: 'pix', name: 'PIX', icon: '/images/payment/pix.svg' },
  { id: 'bank', name: 'Transferência Bancária', icon: '/images/payment/bank.svg' },
];

// Valores pré-definidos
const withdrawalValues = [
  { value: 20, label: 'R$ 20,00' },
  { value: 50, label: 'R$ 50,00' },
  { value: 100, label: 'R$ 100,00' },
  { value: 200, label: 'R$ 200,00' },
];

export default function WithdrawPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, updateUserBalance } = useAuth();
  const [amount, setAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('pix');
  const [pixKey, setPixKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const userBalance = user?.balance || 0;

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

  // Processar saque (simulado)
  const handleWithdraw = async () => {
    if (amount <= 0) {
      setError('Por favor, selecione um valor válido');
      return;
    }

    if (amount > userBalance) {
      setError('Saldo insuficiente para realizar o saque');
      return;
    }

    if (withdrawMethod === 'pix' && !pixKey) {
      setError('Por favor, informe sua chave PIX');
      return;
    }

    setError(null);
    setIsProcessing(true);
    
    try {
      // Simulação de processamento
      console.log(`💸 SIMULAÇÃO: Iniciando saque de ${formatCurrency(amount)} via ${withdrawMethod}`);
      
      // Simular tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Gerar dados de transação simulada
      const transactionId = `wd-${Date.now()}-${uuidv4().substring(0, 8)}`;
      const reference = `WD-${uuidv4().substring(0, 8).toUpperCase()}`;
      
      // Criar objeto de transação
      const simulatedTransaction = {
        id: transactionId,
        type: 'withdrawal',
        amount: amount,
        status: 'completed',
        paymentMethod: withdrawMethod,
        reference: reference,
        createdAt: new Date(),
        accountInfo: withdrawMethod === 'pix' ? { pixKey } : {},
        description: `Saque via ${withdrawMethod === 'pix' ? 'PIX' : 'Transferência Bancária'}`
      };
      
      console.log('✅ Transação simulada:', simulatedTransaction);
      
      // Se disponível, atualizar o saldo do usuário no contexto
      if (typeof updateUserBalance === 'function') {
        const newBalance = userBalance - amount;
        updateUserBalance(newBalance);
        console.log(`💰 Saldo atualizado: ${formatCurrency(newBalance)}`);
      }
      
      // Simular armazenamento no localStorage
      try {
        const storedTransactions = localStorage.getItem('rpx_transactions');
        const transactions = storedTransactions ? JSON.parse(storedTransactions) : [];
        transactions.push(simulatedTransaction);
        localStorage.setItem('rpx_transactions', JSON.stringify(transactions));
      } catch (e) {
        console.error('Erro ao salvar transação no localStorage:', e);
      }
      
      // Redirecionar para página de sucesso
      router.push('/profile/wallet/withdraw/success');
    } catch (error: any) {
      console.error('Erro ao simular saque:', error);
      setError(error.message || 'Ocorreu um erro ao processar seu saque. Tente novamente mais tarde.');
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
    router.push('/auth/login?redirect=/profile/wallet/withdraw');
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
          <h1 className="text-2xl font-bold">Sacar Saldo</h1>
        </div>

        <div className="bg-card rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="bg-card-hover rounded-md p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-muted">Seu saldo atual:</span>
                <span className="font-bold text-xl text-primary">{formatCurrency(userBalance)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 rounded-md p-4 mb-6 flex items-start">
                <AlertTriangle className="text-red-400 mr-3 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <h2 className="font-bold mb-4">Escolha o valor para saque</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {withdrawalValues.map((item) => (
                <button
                  key={item.value}
                  className={`py-3 px-4 rounded-md transition-colors ${
                    amount === item.value
                      ? 'bg-primary text-white'
                      : 'bg-card-hover text-white hover:bg-gray-700'
                  } ${item.value > userBalance ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (item.value <= userBalance) {
                      setAmount(item.value);
                      setCustomAmount('');
                    }
                  }}
                  disabled={item.value > userBalance}
                >
                  {item.label}
                </button>
              ))}
              
              <div className={`py-2 px-4 rounded-md transition-colors ${
                !withdrawalValues.some(wv => wv.value === amount)
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

            <h2 className="font-bold mb-4">Forma de saque</h2>
            
            <div className="space-y-3 mb-6">
              {withdrawalMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 rounded-md flex items-center cursor-pointer transition-colors ${
                    withdrawMethod === method.id
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-card-hover hover:bg-gray-700 border border-transparent'
                  }`}
                  onClick={() => setWithdrawMethod(method.id)}
                >
                  <div className="w-10 h-10 flex items-center justify-center mr-4">
                    {method.icon ? (
                      <img src={method.icon} alt={method.name} className="w-6 h-6 object-contain" />
                    ) : (
                      <DollarSign size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{method.name}</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                    {withdrawMethod === method.id && (
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {withdrawMethod === 'pix' && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Sua chave PIX</label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="w-full bg-card-hover border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Digite sua chave PIX"
                />
              </div>
            )}

            {withdrawMethod === 'bank' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Banco</label>
                  <select className="w-full bg-card-hover border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="" disabled selected>Selecione seu banco</option>
                    <option value="001">Banco do Brasil</option>
                    <option value="341">Itaú</option>
                    <option value="104">Caixa Econômica</option>
                    <option value="033">Santander</option>
                    <option value="237">Bradesco</option>
                    <option value="260">Nubank</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Agência</label>
                  <input
                    type="text"
                    className="w-full bg-card-hover border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Digite sua agência"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Conta</label>
                  <input
                    type="text"
                    className="w-full bg-card-hover border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Digite sua conta com dígito"
                  />
                </div>
              </div>
            )}

            <div className="bg-card-hover rounded-md p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-muted">Valor do saque:</span>
                <span className="font-bold text-xl">{formatCurrency(amount)}</span>
              </div>
            </div>

            <button
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
              onClick={handleWithdraw}
              disabled={isProcessing || amount <= 0 || amount > userBalance || (withdrawMethod === 'pix' && !pixKey)}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <TrendingDown size={18} />
                  <span>Realizar Saque</span>
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
              <h3 className="font-medium text-blue-400">Informações de saque:</h3>
              <ul className="mt-2 text-sm text-gray-300 space-y-1">
                <li>• O valor mínimo para saque é de R$ 10,00</li>
                <li>• Saques via PIX são processados em até 24 horas úteis</li>
                <li>• Saques via transferência bancária podem levar até 3 dias úteis</li>
                <li>• Verifique seus dados bancários antes de confirmar o saque</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 