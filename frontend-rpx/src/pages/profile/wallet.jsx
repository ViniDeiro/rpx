import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { DollarSign, TrendingUp, TrendingDown, Clock, ArrowRight, ArrowLeft } from 'react-feather';

// Dados fictícios de exemplo para transações
const MOCK_TRANSACTIONS = [
  { id: 1, type: 'deposit', amount: 100, status: 'completed', date: '2023-11-15T14:22:00', method: 'pix' },
  { id: 2, type: 'withdrawal', amount: 50, status: 'completed', date: '2023-11-12T10:15:00', method: 'pix' },
  { id: 3, type: 'deposit', amount: 200, status: 'completed', date: '2023-11-10T18:35:00', method: 'card' },
  { id: 4, type: 'match_win', amount: 120, status: 'completed', date: '2023-11-08T15:40:00' },
  { id: 5, type: 'match_bet', amount: 50, status: 'completed', date: '2023-11-08T14:20:00' },
];

export default function WalletPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Simular carregamento de transações
  useEffect(() => {
    if (isAuthenticated) {
      const loadTransactions = async () => {
        setIsTransactionsLoading(true);
        // Em produção, seria uma chamada real à API
        await new Promise(resolve => setTimeout(resolve, 800));
        setTransactions(MOCK_TRANSACTIONS);
        setIsTransactionsLoading(false);
      };
      
      loadTransactions();
    }
  }, [isAuthenticated]);

  // Formatar o valor como moeda brasileira
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data relativa
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar transações com base na tab ativa
  const filteredTransactions = () => {
    if (activeTab === 'all') return transactions;
    if (activeTab === 'deposits') return transactions.filter(t => t.type === 'deposit');
    if (activeTab === 'withdrawals') return transactions.filter(t => t.type === 'withdrawal');
    if (activeTab === 'matches') return transactions.filter(t => ['match_win', 'match_bet'].includes(t.type));
    return transactions;
  };

  // Renderizar ícone de transação
  const renderTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <TrendingUp className="text-green-500" size={20} />;
      case 'withdrawal':
        return <TrendingDown className="text-red-500" size={20} />;
      case 'match_win':
        return <TrendingUp className="text-blue-500" size={20} />;
      case 'match_bet':
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return <DollarSign className="text-gray-500" size={20} />;
    }
  };

  // Obter texto descritivo do tipo de transação
  const getTransactionTypeText = (type) => {
    switch (type) {
      case 'deposit':
        return 'Depósito';
      case 'withdrawal':
        return 'Saque';
      case 'match_win':
        return 'Vitória em partida';
      case 'match_bet':
        return 'Aposta em partida';
      default:
        return 'Transação';
    }
  };

  // Renderizar valor da transação
  const renderTransactionAmount = (type, amount) => {
    const isPositive = ['deposit', 'match_win'].includes(type);
    return (
      <span className={`font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '+' : '-'} {formatCurrency(amount)}
      </span>
    );
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
      router.push('/auth/login?redirect=/profile/wallet');
    }
    return null;
  }

  return (
    <Layout title="Carteira">
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center">
            <Link href="/profile" className="mr-4 flex items-center text-muted hover:text-white transition-colors">
              <ArrowLeft size={18} className="mr-1" />
              Voltar ao Perfil
            </Link>
            <h1 className="text-2xl font-bold">Minha Carteira</h1>
          </div>

          {/* Card do saldo */}
          <div className="bg-gradient-to-r from-purple-700 to-blue-700 rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white opacity-80">Seu saldo disponível</h2>
                <DollarSign className="text-white opacity-80" size={24} />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-4">
                {formatCurrency(user?.balance || 0)}
              </div>
              <div className="flex gap-3">
                <Link 
                  href="/profile/wallet/deposit" 
                  className="bg-white text-purple-800 hover:bg-opacity-90 px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2 flex-1"
                >
                  <TrendingUp size={18} />
                  Depositar
                </Link>
                <Link 
                  href="/profile/wallet/withdraw" 
                  className="bg-white/20 text-white hover:bg-white/30 px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2 flex-1"
                >
                  <TrendingDown size={18} />
                  Sacar
                </Link>
              </div>
            </div>
          </div>

          {/* Card de histórico de transações */}
          <div className="bg-card rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-700 p-4">
              <h2 className="text-lg font-semibold">Histórico de Transações</h2>
            </div>
            
            {/* Tabs para filtrar transações */}
            <div className="flex border-b border-gray-700">
              <button 
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('all')}
              >
                Todas
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'deposits' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('deposits')}
              >
                Depósitos
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'withdrawals' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('withdrawals')}
              >
                Saques
              </button>
              <button 
                className={`px-4 py-3 text-sm font-medium ${activeTab === 'matches' ? 'border-b-2 border-primary text-primary' : 'text-gray-400 hover:text-white'}`}
                onClick={() => setActiveTab('matches')}
              >
                Partidas
              </button>
            </div>
            
            {/* Lista de transações */}
            <div className="divide-y divide-gray-700">
              {isTransactionsLoading ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-muted">Carregando transações...</p>
                </div>
              ) : filteredTransactions().length > 0 ? (
                filteredTransactions().map(transaction => (
                  <div key={transaction.id} className="p-4 hover:bg-card-hover transition-colors">
                    <div className="flex items-center">
                      <div className="mr-4">
                        {renderTransactionIcon(transaction.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {getTransactionTypeText(transaction.type)}
                          {transaction.method && ` via ${transaction.method.toUpperCase()}`}
                        </div>
                        <div className="text-xs text-muted">
                          {formatDate(transaction.date)}
                        </div>
                      </div>
                      <div className="text-right">
                        {renderTransactionAmount(transaction.type, transaction.amount)}
                        <div className="text-xs text-muted">
                          {transaction.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 flex flex-col items-center justify-center">
                  <DollarSign className="text-muted mb-3" size={32} />
                  <p className="text-muted">Nenhuma transação encontrada</p>
                </div>
              )}
            </div>
            
            {/* Rodapé do card */}
            <div className="p-4 border-t border-gray-700 text-center">
              <Link 
                href="#" 
                className="text-primary hover:text-primary-hover text-sm flex items-center justify-center"
              >
                Ver todas as transações
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 