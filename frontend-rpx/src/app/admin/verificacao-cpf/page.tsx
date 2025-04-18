'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Search,
  RefreshCw,
  MoreVerticalIcon,
  CalendarIcon,
  UserIcon,
  FileIcon,
  Clock
} from 'lucide-react';

// Extendendo a interface de usuário para incluir isAdmin
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
  isAdmin?: boolean;
}

// Extendendo a interface de sessão
interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

// Interface para verificações de CPF
interface CPFVerification {
  id: string;
  userId: string;
  username: string;
  cpf: string;
  name: string;
  birthDate: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export default function VerificacaoCPFAdmin() {
  const router = useRouter();
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: "loading" | "authenticated" | "unauthenticated" };
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verifications, setVerifications] = useState<CPFVerification[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<CPFVerification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedVerification, setSelectedVerification] = useState<CPFVerification | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Função para buscar verificações de CPF
  const fetchVerifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/cpf-verifications');
      
      if (!response.ok) {
        throw new Error('Falha ao buscar verificações de CPF');
      }
      
      const data = await response.json();
      
      // Mapear dados para o formato do componente
      setVerifications(data.map((verification: any) => ({
        id: verification._id || verification.id,
        userId: verification.userId,
        username: verification.username || 'Sem username',
        cpf: verification.cpf || 'Não informado',
        name: verification.name || 'Sem nome',
        birthDate: verification.birthDate || new Date().toISOString(),
        submittedAt: verification.submittedAt || new Date().toISOString(),
        status: verification.status || 'pending',
        comment: verification.comment,
        reviewedAt: verification.reviewedAt,
        reviewedBy: verification.reviewedBy
      })));
    } catch (error) {
      console.error('Erro ao buscar verificações de CPF:', error);
      alert('Erro ao carregar verificações de CPF. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para aprovar uma verificação
  const handleApproveVerification = async () => {
    if (!selectedVerification) return;
    
    try {
      const response = await fetch(`/api/admin/cpf-verifications/${selectedVerification.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao aprovar verificação');
      }
      
      // Atualizar lista de verificações
      const updatedVerifications = verifications.map(v => {
        if (v.id === selectedVerification.id) {
          return {
            ...v,
            status: 'approved' as const,
            reviewedBy: session?.user?.username || 'admin',
            reviewedAt: new Date().toISOString()
          };
        }
        return v;
      });
      
      setVerifications(updatedVerifications);
      setModalOpen(false);
      setSuccessMessage('Verificação de CPF aprovada com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao aprovar verificação:', error);
      alert('Erro ao aprovar verificação. Tente novamente.');
    }
  };

  // Função para rejeitar uma verificação
  const handleRejectVerification = async () => {
    if (!selectedVerification) return;
    if (!rejectComment) {
      alert('Por favor, forneça um motivo para a rejeição.');
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/cpf-verifications/${selectedVerification.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: rejectComment })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao rejeitar verificação');
      }
      
      // Atualizar lista de verificações
      const updatedVerifications = verifications.map(v => {
        if (v.id === selectedVerification.id) {
          return {
            ...v,
            status: 'rejected' as const,
            comment: rejectComment,
            reviewedBy: session?.user?.username || 'admin',
            reviewedAt: new Date().toISOString()
          };
        }
        return v;
      });
      
      setVerifications(updatedVerifications);
      setModalOpen(false);
      setRejectComment('');
      setSuccessMessage('Verificação de CPF rejeitada com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao rejeitar verificação:', error);
      alert('Erro ao rejeitar verificação. Tente novamente.');
    }
  };

  // Função para aprovar todas as verificações pendentes
  const handleApproveAllPending = async () => {
    const pendingCount = verifications.filter(v => v.status === 'pending').length;
    
    if (pendingCount === 0) {
      alert('Não há verificações pendentes para aprovar.');
      return;
    }
    
    if (confirm(`Confirma a aprovação de todas as ${pendingCount} verificações pendentes?`)) {
      try {
        const response = await fetch('/api/admin/cpf-verifications/approve-all', {
          method: 'POST'
        });
        
        if (!response.ok) {
          throw new Error('Falha ao aprovar verificações pendentes');
        }
        
        // Atualizar lista de verificações
        const now = new Date().toISOString();
        const updatedVerifications = verifications.map(v => {
          if (v.status === 'pending') {
            return {
              ...v,
              status: 'approved' as const,
              reviewedBy: session?.user?.username || 'admin',
              reviewedAt: now
            };
          }
          return v;
        });
        
        setVerifications(updatedVerifications);
        setSuccessMessage(`${pendingCount} verificações aprovadas com sucesso!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Erro ao aprovar verificações pendentes:', error);
        alert('Erro ao aprovar verificações pendentes. Tente novamente.');
      }
    }
  };

  // Função para abrir modal de verificação
  const handleOpenVerification = (verification: CPFVerification) => {
    setSelectedVerification(verification);
    setModalOpen(true);
  };

  // Formatação de datas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Formatação de CPF
  const formatCPF = (cpf: string) => {
    if (cpf.length !== 11 && !cpf.includes('.')) return cpf;
    
    if (cpf.includes('.')) return cpf;
    
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Obtém estilo baseado no status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' };
      case 'approved': return { label: 'Aprovado', color: 'bg-green-100 text-green-800' };
      case 'rejected': return { label: 'Rejeitado', color: 'bg-red-100 text-red-800' };
      default: return { label: status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Efeito para filtrar verificações
  useEffect(() => {
    let filtered = [...verifications];
    
    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(verif => 
        verif.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verif.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verif.cpf.includes(searchTerm)
      );
    }
    
    // Filtrar por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(verif => verif.status === filterStatus);
    }
    
    setFilteredVerifications(filtered);
  }, [verifications, searchTerm, filterStatus]);

  // Efeito para autenticação e carga inicial
  useEffect(() => {
    if (status === 'loading') return;

    if (!session || !session.user) {
      router.push('/login');
      return;
    }

    if (session.user.isAdmin) {
      setIsAdmin(true);
      fetchVerifications();
    } else {
      router.push('/');
    }
  }, [session, status, router]);

  // Calcular estatísticas
  const stats = {
    pendingCount: verifications.filter(v => v.status === 'pending').length,
    approvedCount: verifications.filter(v => v.status === 'approved').length,
    rejectedCount: verifications.filter(v => v.status === 'rejected').length,
    totalCount: verifications.length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Verificação de CPF</h1>
          <p className="text-gray-500 mt-1">Valide os documentos CPF enviados pelos usuários</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => router.push('/admin')}>
            Voltar para Dashboard
          </Button>
          <Button 
            onClick={handleApproveAllPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle size={18} className="mr-2" />
            Aprovar Todos Pendentes
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
              <FileIcon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <h4 className="text-xl font-bold text-gray-800">{stats.totalCount}</h4>
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
            <Input
              type="text"
              placeholder="Buscar por nome, usuário ou CPF..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-auto"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
          
          <Button 
            variant="outline" 
            onClick={fetchVerifications}
            className="flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Atualizar
          </Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Nome Completo</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Data de Nascimento</TableHead>
                <TableHead>Data de Envio</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVerifications.length > 0 ? (
                filteredVerifications.map((verification) => {
                  const statusStyle = getStatusStyle(verification.status);
                  
                  return (
                    <TableRow key={verification.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{verification.username}</TableCell>
                      <TableCell>{verification.name}</TableCell>
                      <TableCell>{formatCPF(verification.cpf)}</TableCell>
                      <TableCell>{new Date(verification.birthDate).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{formatDate(verification.submittedAt)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.color}`}>
                          {statusStyle.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreVerticalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => handleOpenVerification(verification)}
                            >
                              <Eye size={16} />
                              <span>Ver detalhes</span>
                            </DropdownMenuItem>
                            
                            {verification.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  className="flex items-center gap-2 text-green-600"
                                  onClick={() => {
                                    setSelectedVerification(verification);
                                    handleApproveVerification();
                                  }}
                                >
                                  <CheckCircle size={16} />
                                  <span>Aprovar</span>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem
                                  className="flex items-center gap-2 text-red-600"
                                  onClick={() => {
                                    setSelectedVerification(verification);
                                    setModalOpen(true);
                                  }}
                                >
                                  <XCircle size={16} />
                                  <span>Rejeitar</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    Nenhuma verificação de CPF encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Verificação */}
      {modalOpen && selectedVerification && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Verificação de CPF</DialogTitle>
              <DialogDescription>
                Detalhes da verificação de {selectedVerification.username}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Usuário</h4>
                  <p className="font-medium">{selectedVerification.username}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Nome</h4>
                  <p className="font-medium">{selectedVerification.name}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">CPF</h4>
                  <p className="font-medium">{formatCPF(selectedVerification.cpf)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Data de Nascimento</h4>
                  <p className="font-medium">{new Date(selectedVerification.birthDate).toLocaleDateString('pt-BR')}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(selectedVerification.status).color}`}>
                    {getStatusStyle(selectedVerification.status).label}
                  </span>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Data de Envio</h4>
                  <p className="font-medium">{formatDate(selectedVerification.submittedAt)}</p>
                </div>
              </div>
            </div>
            
            {selectedVerification.status === 'rejected' && (
              <div className="bg-red-50 p-3 rounded-md mb-4">
                <h4 className="text-sm font-medium text-red-800">Motivo da Rejeição:</h4>
                <p className="text-sm text-red-700">{selectedVerification.comment}</p>
              </div>
            )}
            
            {selectedVerification.status === 'pending' && (
              <div className="space-y-4">
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-gray-700 mb-1">
                    Motivo da rejeição (obrigatório para rejeitar):
                  </label>
                  <textarea
                    className="border border-gray-300 rounded-md p-2"
                    rows={3}
                    value={rejectComment}
                    onChange={(e) => setRejectComment(e.target.value)}
                    placeholder="Informe o motivo da rejeição..."
                  ></textarea>
                </div>
                
                <DialogFooter className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    type="button"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleRejectVerification}
                  >
                    <XCircle size={16} className="mr-2" />
                    Rejeitar
                  </Button>
                  
                  <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleApproveVerification}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Aprovar
                  </Button>
                </DialogFooter>
              </div>
            )}
            
            {selectedVerification.status !== 'pending' && (
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
                  Fechar
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 