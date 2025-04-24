'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, TrendingUp, TrendingDown, Clock, ArrowLeft } from 'react-feather';
import { useAuth } from '@/contexts/AuthContext';

// Interface para definir o tipo de Transaction
interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  method?: string; // Propriedade opcional
  description?: string;
  reference?: string;
}

export default function WalletPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Carregar transações reais da API
  useEffect(() => {
    if (isAuthenticated) {
      const loadTransactions = async () => {
        setIsTransactionsLoading(true);
        setError(null);
        
        try {
          const response = await fetch('/api/wallet/transactions');
          
          if (!response.ok) {
            throw new Error('Falha ao carregar transações');
          }
          
          const data = await response.json();
          setTransactions(data.transactions || []);
        } catch (err) {
          console.error('Erro ao carregar transações:', err);
          setError('Não foi possível carregar suas transações. Tente novamente mais tarde.');
          setTransactions([]);
        } finally {
          setIsTransactionsLoading(false);
        }
      };
      
      loadTransactions();
    }
  }, [isAuthenticated]);

  // Função para formatar valores em moeda
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  // Função para formatar datas
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Filtrar transações com base na tab ativa
  const filteredTransactions = transactions.filter(transaction => {
    if (activeTab === 'all') return true;
    if (activeTab === 'deposits') return transaction.type.includes('deposit');
    if (activeTab === 'withdrawals') return transaction.type.includes('withdrawal');
    if (activeTab === 'matches') return transaction.type.includes('match');
    return false;
  });

  // Renderiza o ícone correto para cada tipo de transação
  function getTransactionIcon(type: string) {
    switch(true) {
      case type.includes('deposit'):
        return <TrendingUp className="text-green-500" />;
      case type.includes('withdrawal'):
        return <TrendingDown className="text-red-500" />;
      case type.includes('match'):
        return <TrendingUp className="text-blue-500" />;
      default:
        return <Clock className="text-gray-500" />;
    }
  }

  // Renderiza o valor da transação com a cor apropriada
  function renderTransactionAmount(type: string, amount: number) {
    const isPositive = type.includes('deposit') || type.includes('win');
    return (
      <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {isPositive ? '+' : '-'}{formatCurrency(amount)}
      </span>
    );
  }

  // Obter texto descritivo do tipo de transação
  const getTransactionDescriptionText = (transaction: Transaction): string => {
    // Se a transação já tiver uma descrição, usá-la
    if (transaction.description) {
      return transaction.description;
    }
    
    // Caso contrário, usar o tipo para gerar uma descrição
    switch (transaction.type) {
      case 'deposit':
        return 'Depósito na carteira';
      case 'withdrawal':
        return 'Saque da carteira';
      case 'match_win':
        return 'Vitória em partida';
      case 'match_bet':
        return 'Aposta em partida';
      default:
        return 'Transação';
    }
  };

  // Mapear status para texto legível
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
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
    router.push('/auth/login?redirect=/profile/wallet');
    return null;
  }

  return (
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
              <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-400">
                {error}
              </div>
            ) : filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-card-hover transition-colors">
                  <div className="flex items-center">
                    <div className="mr-3 p-2 bg-card-hover rounded-full">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {getTransactionDescriptionText(transaction)}
                        {transaction.method && (
                          <span className="text-sm text-gray-400 ml-2">
                            via {transaction.method === 'pix' ? 'PIX' : transaction.method === 'credit_card' ? 'Cartão' : transaction.method}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(transaction.date)}
                        {transaction.reference && (
                          <span className="ml-2">#{transaction.reference}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {renderTransactionAmount(transaction.type, transaction.amount)}
                      <div className={`text-xs mt-1 ${
                        transaction.status === 'completed' ? 'text-green-400' : 
                        transaction.status === 'pending' ? 'text-yellow-400' : 
                        'text-red-400'
                      }`}>
                        {getStatusText(transaction.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                Nenhuma transação encontrada.
                <div className="mt-2">
                  <Link href="/profile/wallet/deposit" className="text-primary hover:underline">
                    Faça seu primeiro depósito!
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {/* Paginação */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t border-gray-700 flex justify-between items-center">
              <button 
                className="px-3 py-1 text-sm bg-card-hover rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                Anterior
              </button>
              <span className="text-sm text-gray-400">Página 1 de 1</span>
              <button 
                className="px-3 py-1 text-sm bg-card-hover rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 