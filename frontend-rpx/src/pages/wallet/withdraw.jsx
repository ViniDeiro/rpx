import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, DollarSign } from 'react-feather';
import Link from 'next/link';

const withdrawalMethods = [
  { id: 'pix', name: 'PIX', icon: '/images/payment/pix.svg' },
  { id: 'bank', name: 'Transferência Bancária', icon: '/images/payment/bank.svg' },
];

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
  
  const userBalance = user?.balance || 0;

  // Manipulador para valor personalizado
  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setCustomAmount(value);
    if (value) {
      setAmount(parseInt(value, 10));
    } else {
      setAmount(0);
    }
  };

  // Formatar o valor como moeda brasileira
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Processar saque
  const handleWithdraw = async () => {
    if (amount <= 0) {
      alert('Por favor, selecione um valor válido');
      return;
    }

    if (amount > userBalance) {
      alert('Saldo insuficiente para realizar o saque');
      return;
    }

    if (withdrawMethod === 'pix' && !pixKey) {
      alert('Por favor, informe sua chave PIX');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Fazer chamada à API simulada
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          paymentMethod: withdrawMethod,
          userId: user.id,
          accountInfo: withdrawMethod === 'pix' 
            ? { pixKey } 
            : { bank: 'simulado', agency: '0001', account: '123456' }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao processar saque');
      }
      
      // Atualizar o saldo do usuário localmente se atualizarUserBalance estiver disponível
      if (typeof updateUserBalance === 'function' && data.currentBalance !== undefined) {
        updateUserBalance(data.currentBalance);
      }
      
      // Redirecionar para página de sucesso
      router.push('/wallet/withdraw/success');
    } catch (error) {
      console.error('Erro ao processar saque:', error);
      alert('Ocorreu um erro ao processar seu saque. Tente novamente mais tarde.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Layout title="Carregando...">
        <div className="container py-16">
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/auth/login?redirect=/profile/wallet/withdraw');
    }
    return null;
  }

  return (
    <Layout title="Saque">
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
                    className="bg-card-hover border border-gray-600 rounded-md p-3 w-full"
                    placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                  />
                </div>
              )}

              {withdrawMethod === 'bank' && (
                <div className="mb-6 bg-yellow-900/30 border border-yellow-600/50 p-4 rounded-md">
                  <p className="text-sm text-yellow-300">
                    <strong>Nota:</strong> Para saques via transferência bancária, será necessário completar a 
                    verificação de identidade. Você será redirecionado após confirmar.
                  </p>
                </div>
              )}

              <div className="bg-card-hover rounded-md p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-muted">Valor do saque:</span>
                  <span className="font-bold text-xl">{formatCurrency(amount)}</span>
                </div>
                {amount > 0 && (
                  <div className="text-xs text-muted mt-2">
                    Taxa de processamento: {formatCurrency(amount * 0.03)} (3%)
                  </div>
                )}
              </div>

              <button
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                onClick={handleWithdraw}
                disabled={isProcessing || amount <= 0 || amount > userBalance}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <DollarSign size={18} />
                    <span>Solicitar Saque</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-md p-4 text-sm text-muted">
            <p>
              <strong className="text-white">Importante:</strong> Os saques são processados em até 48 horas úteis. 
              O valor mínimo para saque é R$ 20,00 e há uma taxa de processamento de 3% sobre o valor solicitado.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 