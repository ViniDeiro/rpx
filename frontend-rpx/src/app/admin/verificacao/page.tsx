'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  Camera,
  Download,
  ExternalLink,
  Filter,
  Calendar,
  DollarSign
} from 'react-feather';
import Link from 'next/link';
import Image from 'next/image';

// Definir a interface para as verificações
interface VerificationRequest {
  id: string;
  matchId: string;
  matchTitle: string;
  submittedBy: string;
  username: string;
  submittedAt: string;
  result: {
    winner: 'team1' | 'team2' | 'draw';
    team1Score?: number;
    team2Score?: number;
    screenshots: string[];
    verifiedBy?: string;
    verifiedAt?: string;
    disputeStatus?: 'none' | 'pending' | 'resolved';
  };
  status: 'pending' | 'approved' | 'rejected' | 'disputed';
  comment?: string;
  disputeReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  prize: number;
  [key: string]: any; // Permite acesso indexado para ordenação
}

// Dados simulados para testes
const initialVerifications: VerificationRequest[] = Array.from({ length: 15 }).map((_, i) => {
  const statuses: ('pending' | 'approved' | 'rejected' | 'disputed')[] = 
    ['pending', 'approved', 'rejected', 'disputed'];
  
  // Garantir que tenhamos mais pendentes do que os outros status
  const status = i < 8 ? 'pending' : statuses[i % statuses.length];
  
  const date = new Date();
  date.setDate(date.getDate() - i);
  
  const winner = Math.random() > 0.5 ? 'team1' : 'team2';
  const team1Score = winner === 'team1' ? 3 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 3);
  const team2Score = winner === 'team2' ? 3 + Math.floor(Math.random() * 3) : Math.floor(Math.random() * 3);
  
  return {
    id: `verif-${1000 + i}`,
    matchId: `match-${500 + i}`,
    matchTitle: `Partida #${500 + i} - ${i % 2 === 0 ? 'Squad' : 'Duo'}`,
    submittedBy: `user-${200 + (i % 5)}`,
    username: `usuario${200 + (i % 5)}`,
    submittedAt: date.toISOString(),
    result: {
      winner,
      team1Score,
      team2Score,
      screenshots: [
        'https://via.placeholder.com/800x600?text=Screenshot+Partida',
        // Adicione mais screenshots para alguns casos
        ...(i % 3 === 0 ? ['https://via.placeholder.com/800x600?text=Screenshot+Extra'] : [])
      ],
      verifiedBy: status !== 'pending' ? 'admin-user' : undefined,
      verifiedAt: status !== 'pending' ? new Date(date.getTime() + 3600000).toISOString() : undefined, // 1h depois da submissão
      disputeStatus: status === 'disputed' ? 'pending' : 'none'
    },
    status,
    comment: status === 'rejected' ? 'Screenshot não mostra claramente o resultado' : undefined,
    disputeReason: status === 'disputed' ? 'O resultado submetido não corresponde ao verdadeiro resultado da partida' : undefined,
    reviewedBy: status !== 'pending' ? 'admin-user' : undefined,
    reviewedAt: status !== 'pending' ? new Date(date.getTime() + 3600000).toISOString() : undefined,
    prize: 10 * (i % 3 + 1)
  };
});

// Componente principal
export default function VerificacaoAdmin() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>(initialVerifications);
  const [filteredVerifications, setFilteredVerifications] = useState<VerificationRequest[]>(initialVerifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('submittedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Ordenação e filtragem
  useEffect(() => {
    let filtered = [...verifications];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(verif => 
        verif.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verif.matchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verif.matchTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verif.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(verif => verif.status === filterStatus);
    }
    
    // Filtrar por data
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(verif => new Date(verif.submittedAt) >= startDate);
    }
    
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Fim do dia
      filtered = filtered.filter(verif => new Date(verif.submittedAt) <= endDate);
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredVerifications(filtered);
  }, [verifications, searchTerm, sortField, sortDirection, filterStatus, dateRange]);

  // Função para ordenar
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Função para abrir modal de verificação
  const handleOpenVerification = (verification: VerificationRequest) => {
    setSelectedVerification(verification);
    setModalOpen(true);
  };

  // Função para aprovar uma verificação
  const handleApproveVerification = (verification: VerificationRequest) => {
    // Em produção, faria uma chamada à API para aprovar a verificação
    const updatedVerifications = verifications.map(v => {
      if (v.id === verification.id) {
        return {
          ...v,
          status: 'approved' as const,
          reviewedBy: 'admin-user',
          reviewedAt: new Date().toISOString(),
          result: {
            ...v.result,
            verifiedBy: 'admin-user',
            verifiedAt: new Date().toISOString(),
            disputeStatus: 'none' as const
          }
        };
      }
      return v;
    });
    
    setVerifications(updatedVerifications);
    setModalOpen(false);
    
    // Mostrar mensagem de sucesso
    setSuccessMessage('Resultado aprovado com sucesso! Prêmio creditado automaticamente.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Função para rejeitar uma verificação
  const handleRejectVerification = (verification: VerificationRequest) => {
    if (!rejectComment) {
      alert('Por favor, forneça um motivo para a rejeição.');
      return;
    }
    
    // Em produção, faria uma chamada à API para rejeitar a verificação
    const updatedVerifications = verifications.map(v => {
      if (v.id === verification.id) {
        return {
          ...v,
          status: 'rejected' as const,
          comment: rejectComment,
          reviewedBy: 'admin-user',
          reviewedAt: new Date().toISOString()
        };
      }
      return v;
    });
    
    setVerifications(updatedVerifications);
    setModalOpen(false);
    setRejectComment('');
    
    // Mostrar mensagem de sucesso
    setSuccessMessage('Resultado rejeitado.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Função para aprovar todas as verificações pendentes
  const handleApproveAllPending = () => {
    const pendingCount = verifications.filter(v => v.status === 'pending').length;
    
    if (pendingCount === 0) {
      alert('Não há verificações pendentes para aprovar.');
      return;
    }
    
    if (confirm(`Confirma a aprovação de todas as ${pendingCount} verificações pendentes?`)) {
      const now = new Date().toISOString();
      const updatedVerifications = verifications.map(v => {
        if (v.status === 'pending') {
          return {
            ...v,
            status: 'approved' as const,
            reviewedBy: 'admin-user',
            reviewedAt: now,
            result: {
              ...v.result,
              verifiedBy: 'admin-user',
              verifiedAt: now,
              disputeStatus: 'none' as const
            }
          };
        }
        return v;
      });
      
      setVerifications(updatedVerifications);
      
      // Mostrar mensagem de sucesso
      setSuccessMessage(`${pendingCount} resultados aprovados com sucesso! Prêmios creditados automaticamente.`);
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

  // Helper para obter cor baseada no status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
      case 'approved': return { label: 'Aprovado', color: 'bg-green-100 text-green-800' };
      case 'rejected': return { label: 'Rejeitado', color: 'bg-red-100 text-red-800' };
      case 'disputed': return { label: 'Em disputa', color: 'bg-orange-100 text-orange-800' };
      default: return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Calcular estatísticas
  const stats = {
    pendingCount: verifications.filter(v => v.status === 'pending').length,
    approvedCount: verifications.filter(v => v.status === 'approved').length,
    rejectedCount: verifications.filter(v => v.status === 'rejected').length,
    disputedCount: verifications.filter(v => v.status === 'disputed').length,
    totalPrizes: verifications.filter(v => v.status === 'approved').reduce((sum, v) => sum + v.prize, 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Verificação de Resultados</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleApproveAllPending}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <CheckCircle size={18} className="mr-2" />
            Aprovar Todos Pendentes
          </button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pendentes</p>
              <h4 className="text-xl font-bold text-gray-800">{stats.pendingCount}</h4>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Aprovados</p>
              <h4 className="text-xl font-bold text-gray-800">{stats.approvedCount}</h4>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rejeitados</p>
              <h4 className="text-xl font-bold text-gray-800">{stats.rejectedCount}</h4>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
              <Filter size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Em Disputa</p>
              <h4 className="text-xl font-bold text-gray-800">{stats.disputedCount}</h4>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Prêmios Pagos</p>
              <h4 className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalPrizes)}</h4>
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
              placeholder="Buscar por ID, partida, usuário..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-purple-500 focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-purple-500 focus:border-purple-500 w-full md:w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
              <option value="disputed">Em disputa</option>
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

      {/* Tabela de Verificações */}
      <div className="bg-white overflow-hidden rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('matchId')}
                >
                  <div className="flex items-center">
                    Partida
                    {sortField === 'matchId' && (
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
                    Enviado Por
                    {sortField === 'username' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Resultado
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Prêmio
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
                  onClick={() => handleSort('submittedAt')}
                >
                  <div className="flex items-center">
                    Data Envio
                    {sortField === 'submittedAt' && (
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
              {filteredVerifications.map((verification) => {
                const statusStyle = getStatusStyle(verification.status);
                
                return (
                  <tr key={verification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {verification.matchTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {verification.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {verification.result.winner === 'team1' ? 'Time 1 vence ' : 'Time 2 vence '}
                      ({verification.result.team1Score} - {verification.result.team2Score})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(verification.prize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(verification.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenVerification(verification)}
                          title="Ver detalhes"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {verification.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveVerification(verification)}
                              title="Aprovar"
                              className="text-green-600 hover:text-green-800"
                            >
                              <CheckCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredVerifications.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma verificação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Verificação */}
      {modalOpen && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Verificação de Resultado - {selectedVerification.matchTitle}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Informações da Partida</h4>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ID:</span>
                      <span className="text-sm font-medium">{selectedVerification.matchId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Enviado por:</span>
                      <span className="text-sm font-medium">{selectedVerification.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Data de envio:</span>
                      <span className="text-sm font-medium">{formatDate(selectedVerification.submittedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Prêmio:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedVerification.prize)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Resultado Submetido</h4>
                  <div className="bg-gray-50 p-4 rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Vencedor:</span>
                      <span className="text-sm font-medium">
                        {selectedVerification.result.winner === 'team1' ? 'Time 1' : 'Time 2'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Placar:</span>
                      <span className="text-sm font-medium">
                        {selectedVerification.result.team1Score} - {selectedVerification.result.team2Score}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${getStatusStyle(selectedVerification.status).color}`}>
                        {getStatusStyle(selectedVerification.status).label}
                      </span>
                    </div>
                    {selectedVerification.comment && (
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600">Comentário:</span>
                        <span className="text-sm font-medium mt-1 text-red-600">{selectedVerification.comment}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Screenshots</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedVerification.result.screenshots.map((screenshot, index) => (
                    <div key={index} className="border border-gray-200 rounded-md overflow-hidden">
                      <div className="relative h-48 w-full">
                        <Image 
                          src={screenshot} 
                          alt={`Screenshot ${index + 1}`}
                          layout="fill"
                          objectFit="cover"
                        />
                      </div>
                      <div className="p-2 bg-gray-50 flex justify-between items-center">
                        <span className="text-xs text-gray-500">Screenshot {index + 1}</span>
                        <div className="flex space-x-2">
                          <a 
                            href={screenshot} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink size={16} />
                          </a>
                          <a 
                            href={screenshot} 
                            download={`screenshot-${selectedVerification.matchId}-${index}.jpg`}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Download size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedVerification.status === 'pending' && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Ações</h4>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <label className="text-sm text-gray-600 mb-1">Comentário em caso de rejeição:</label>
                      <textarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500"
                        rows={3}
                        placeholder="Explique o motivo da rejeição (obrigatório em caso de rejeição)"
                      ></textarea>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleApproveVerification(selectedVerification)}
                        className="px-4 py-2 bg-green-600 rounded-md text-white hover:bg-green-700 flex items-center"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Aprovar e Pagar
                      </button>
                      
                      <button
                        onClick={() => handleRejectVerification(selectedVerification)}
                        className="px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700 flex items-center"
                      >
                        <XCircle size={16} className="mr-2" />
                        Rejeitar
                      </button>
                      
                      <button
                        onClick={() => setModalOpen(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 