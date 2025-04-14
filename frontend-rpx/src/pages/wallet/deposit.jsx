import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, DollarSign, ArrowLeft } from 'react-feather';
import Link from 'next/link';

const paymentMethods = [
  { id: 'pix', name: 'PIX', icon: '/images/payment/pix.svg' },
  { id: 'card', name: 'Cartão de Crédito', icon: '/images/payment/credit-card.svg' },
  { id: 'boleto', name: 'Boleto Bancário', icon: '/images/payment/boleto.svg' },
];

const depositValues = [
  { value: 20, label: 'R$ 20,00' },
  { value: 50, label: 'R$ 50,00' },
  { value: 100, label: 'R$ 100,00' },
  { value: 200, label: 'R$ 200,00' },
  { value: 500, label: 'R$ 500,00' },
];

export default function DepositPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [amount, setAmount] = useState(50); // Valor padrão R$ 50
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Processar depósito
  const handleDeposit = async () => {
    if (amount <= 0) {
      alert('Por favor, selecione um valor válido');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirecionar para página de sucesso (em produção, seria redirecionado para o gateway de pagamento)
      router.push('/wallet/deposit/success');
    } catch (error) {
      console.error('Erro ao processar depósito:', error);
      alert('Ocorreu um erro ao processar seu depósito. Tente novamente mais tarde.');
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
    router.push('/auth/login?redirect=/wallet/deposit');
    return null;
  }

  return (
    <Layout title="Depósito">
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex items-center">
            <Link href="/profile" className="mr-4 flex items-center text-muted hover:text-white transition-colors">
              <ArrowLeft size={18} className="mr-1" />
              Voltar
            </Link>
            <h1 className="text-2xl font-bold">Depositar Saldo</h1>
          </div>

          <div className="bg-card rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <h2 className="font-bold mb-4">Escolha o valor</h2>
              
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
                  !depositValues.some(dv => dv.value === amount)
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

          <div className="bg-card rounded-lg shadow-md p-4 text-sm text-muted">
            <p>
              <strong className="text-white">Importante:</strong> Os depósitos são processados instantaneamente para PIX e em 
              até 24h para boletos. Valores depositados não são passíveis de reembolso e devem ser utilizados na plataforma.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 