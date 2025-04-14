'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Clock,
  Download,
  Filter,
  User,
  Calendar
} from 'react-feather';
import Link from 'next/link';

// Definir a interface para Transaction
interface Transaction {
  id: string;
  userId: string;
  username: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'match_win' | 'match_entry' | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'processing';
  createdAt: string;
  updatedAt: string;
  paymentMethod?: string;
  reference?: string;
  description?: string;
  matchId?: string;
  [key: string]: any; // Permite acesso indexado para ordenação
}

// Dados simulados para testes
const initialTransactions: Transaction[] = Array.from({ length: 20 }).map((_, i) => {
  const types: ('deposit' | 'withdrawal' | 'match_win' | 'match_entry' | 'refund')[] = 
    ['deposit', 'withdrawal', 'match_win', 'match_entry', 'refund'];
  
  const statuses: ('pending' | 'completed' | 'failed' | 'processing')[] = 
    ['pending', 'completed', 'failed', 'processing'];
  
  const paymentMethods = ['pix', 'credit_card', 'bank_transfer'];
  
  // Alterna entre tipos diferentes para simular dados variados
  const type = types[i % types.length];
  // Match_win e refund são sempre completed; metade dos match_entry são pending
  const status = type === 'match_win' || type === 'refund' 
    ? 'completed' 
    : type === 'match_entry' && i % 2 === 0 
      ? 'pending' 
      : statuses[i % statuses.length];
  
  const date = new Date();
  date.setDate(date.getDate() - i);

  return {
    id: `tx-${1000 + i}`,
    userId: `user-${200 + (i % 5)}`,
    username: `usuario${200 + (i % 5)}`,
    amount: type === 'match_entry' ? 5 * (i % 3 + 1) : type === 'match_win' ? 9 * (i % 3 + 1) : 10 * (i % 10 + 1),
    type,
    status,
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
    paymentMethod: ['deposit', 'withdrawal'].includes(type) ? paymentMethods[i % paymentMethods.length] : undefined,
    reference: `REF-${9000 + i}`,
    description: type === 'match_win' 
      ? `Premiação: Partida #${500 + i}`
      : type === 'match_entry'
      ? `Inscrição: Partida #${500 + i}`
      : type === 'deposit'
      ? `Depósito via ${paymentMethods[i % paymentMethods.length].toUpperCase()}`
      : type === 'withdrawal'
      ? `Saque via ${paymentMethods[i % paymentMethods.length].toUpperCase()}`
      : `Reembolso: Partida cancelada #${500 + i}`,
    matchId: ['match_win', 'match_entry', 'refund'].includes(type) ? `match-${500 + i}` : undefined
  };
});

// Componente principal
export default function FinanceiroAdmin() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(initialTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [successMessage, setSuccessMessage] = useState('');

  // Ordenação e filtragem
  useEffect(() => {
    let filtered = [...transactions];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }
    
    // Filtrar por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }
    
    // Filtrar por data
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(tx => new Date(tx.createdAt) >= startDate);
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Fim do dia
      filtered = filtered.filter(tx => new Date(tx.createdAt) <= endDate);
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, sortField, sortDirection, filterType, filterStatus, dateRange]);

  // Função para ordenar
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para aprovar pagamentos pendentes
  const handleApprovePayment = (id: string) => {
    if (confirm('Confirma a aprovação deste pagamento?')) {
      // Em produção, faria uma chamada à API para aprovar o pagamento
      const updatedTransactions = transactions.map(tx => {
        if (tx.id === id) {
          return { ...tx, status: 'completed' as const, updatedAt: new Date().toISOString() };
        }
        return tx;
      });
      
      setTransactions(updatedTransactions);
      
      // Mostrar mensagem de sucesso
      setSuccessMessage('Pagamento aprovado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Função para reprovar pagamentos pendentes
  const handleRejectPayment = (id: string) => {
    if (confirm('Confirma a reprovação deste pagamento?')) {
      // Em produção, faria uma chamada à API para reprovar o pagamento
      const updatedTransactions = transactions.map(tx => {
        if (tx.id === id) {
          return { ...tx, status: 'failed' as const, updatedAt: new Date().toISOString() };
        }
        return tx;
      });
      
      setTransactions(updatedTransactions);
      
      // Mostrar mensagem de sucesso
      setSuccessMessage('Pagamento reprovado.');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Função para aprovar todos os pagamentos de uma vez
  const handleApproveAllPending = () => {
    const pendingCount = transactions.filter(tx => tx.status === 'pending' && tx.type === 'match_win').length;
    
    if (pendingCount === 0) {
      alert('Não há pagamentos pendentes para aprovar.');
      return;
    }
    
    if (confirm(`Confirma a aprovação de todos os ${pendingCount} pagamentos pendentes?`)) {
      const updatedTransactions = transactions.map(tx => {
        if (tx.status === 'pending' && tx.type === 'match_win') {
          return { ...tx, status: 'completed' as const, updatedAt: new Date().toISOString() };
        }
        return tx;
      });
      
      setTransactions(updatedTransactions);
      
      // Mostrar mensagem de sucesso
      setSuccessMessage(`${pendingCount} pagamentos aprovados com sucesso!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Helper para formatar datas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Helper para obter cor baseada no tipo de transação
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'deposit': return { label: 'Depósito', color: 'bg-green-100 text-green-800' };
      case 'withdrawal': return { label: 'Saque', color: 'bg-orange-100 text-orange-800' };
      case 'match_win': return { label: 'Premiação', color: 'bg-purple-100 text-purple-800' };
      case 'match_entry': return { label: 'Inscrição', color: 'bg-blue-100 text-blue-800' };
      case 'refund': return { label: 'Reembolso', color: 'bg-yellow-100 text-yellow-800' };
      default: return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Helper para obter cor baseada no status da transação
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return { label: 'Concluído', color: 'bg-green-100 text-green-800' };
      case 'pending': return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
      case 'failed': return { label: 'Falhou', color: 'bg-red-100 text-red-800' };
      case 'processing': return { label: 'Processando', color: 'bg-blue-100 text-blue-800' };
      default: return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Calcular estatísticas
  const stats = {
    totalTransactions: filteredTransactions.length,
    totalDeposits: filteredTransactions.filter(tx => tx.type === 'deposit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0),
    totalWithdrawals: filteredTransactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0),
    totalPrizes: filteredTransactions.filter(tx => tx.type === 'match_win' && tx.status === 'completed')
      .reduce((sum, tx) => sum + tx.amount, 0),
    pendingCount: filteredTransactions.filter(tx => tx.status === 'pending').length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciamento Financeiro</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleApproveAllPending}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <CheckCircle size={18} className="mr-2" />
            Aprovar Pendentes
          </button>
          <button
            onClick={() => {}}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Download size={18} className="mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Depósitos</p>
              <h4 className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalDeposits)}</h4>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Saques</p>
              <h4 className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalWithdrawals)}</h4>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Prêmios</p>
              <h4 className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalPrizes)}</h4>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transações Pendentes</p>
              <h4 className="text-xl font-bold text-gray-800">{stats.pendingCount}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por ID, usuário, referência..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-purple-500 focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500 w-full md:w-auto"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Todos os tipos</option>
              <option value="deposit">Depósitos</option>
              <option value="withdrawal">Saques</option>
              <option value="match_win">Premiações</option>
              <option value="match_entry">Inscrições</option>
              <option value="refund">Reembolsos</option>
            </select>
          </div>
          
          <div>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500 w-full md:w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="completed">Concluídos</option>
              <option value="processing">Em processamento</option>
              <option value="failed">Falhos</option>
            </select>
          </div>
        </div>
        
        <div className="mt-3 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
            <label className="text-sm text-gray-600">De:</label>
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-2">
            <label className="text-sm text-gray-600">Até:</label>
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          
          <button
            onClick={() => setDateRange({ start: '', end: '' })}
            className="text-purple-600 hover:text-purple-800 px-4 py-2"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md flex items-center shadow-md z-50">
          <CheckCircle size={18} className="mr-2" />
          {successMessage}
        </div>
      )}

      {/* Tabela de Transações */}
      <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    ID
                    {sortField === 'id' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('username')}
                >
                  <div className="flex items-center">
                    Usuário
                    {sortField === 'username' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Tipo
                    {sortField === 'type' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Valor
                    {sortField === 'amount' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Data
                    {sortField === 'createdAt' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const typeStyle = getTypeStyle(transaction.type);
                const statusStyle = getStatusStyle(transaction.status);
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        {transaction.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${typeStyle.color}`}>
                        {typeStyle.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {}}
                          title="Ver detalhes"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FileText size={18} />
                        </button>
                        
                        {transaction.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprovePayment(transaction.id)}
                              title="Aprovar"
                              className="text-green-600 hover:text-green-800"
                            >
                              <CheckCircle size={18} />
                            </button>
                            
                            <button
                              onClick={() => handleRejectPayment(transaction.id)}
                              title="Rejeitar"
                              className="text-red-600 hover:text-red-800"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 