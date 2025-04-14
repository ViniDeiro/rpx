'use client';

import { useState, useEffect } from 'react';
import { Search, User, Shield, Filter, ChevronDown, Edit, Trash, UserPlus, RefreshCw } from 'react-feather';
import Link from 'next/link';

// Tipos
interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: 'jogador' | 'admin';
  status: 'ativo' | 'inativo' | 'bloqueado';
  dataCadastro: string;
  ultimoLogin: string | null;
  saldo?: number;
}

export default function UsuariosPage() {
  // Estados
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'jogador' | 'admin'>('todos');
  const [statusFiltro, setStatusFiltro] = useState<'todos' | 'ativo' | 'inativo' | 'bloqueado'>('todos');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Buscar dados (simulado)
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        setIsLoading(true);
        
        // Chamada real à API usando App Router
        const response = await fetch('/api/admin/usuarios');
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar usuários: ${response.status}`);
        }
        
        const data = await response.json();
        
        setUsuarios(data);
        setFilteredUsuarios(data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        
        // Em caso de erro na API, usar dados fictícios para não quebrar a UI
        const dadosSimulados: Usuario[] = [
          {
            id: 1,
            nome: 'João Silva',
            email: 'joao.silva@email.com',
            tipoUsuario: 'jogador',
            status: 'ativo',
            dataCadastro: '2023-10-15',
            ultimoLogin: '2024-04-05',
            saldo: 350.75
          },
          {
            id: 2,
            nome: 'Maria Oliveira',
            email: 'maria.oliveira@email.com',
            tipoUsuario: 'jogador',
            status: 'ativo',
            dataCadastro: '2023-11-20',
            ultimoLogin: '2024-04-06',
            saldo: 127.50
          },
          {
            id: 3,
            nome: 'Admin Principal',
            email: 'admin@rpx.com',
            tipoUsuario: 'admin',
            status: 'ativo',
            dataCadastro: '2023-01-01',
            ultimoLogin: '2024-04-07'
          },
          // Mantendo alguns dados fictícios como fallback
        ];
        
        setUsuarios(dadosSimulados);
        setFilteredUsuarios(dadosSimulados);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  // Filtrar usuários quando os filtros mudarem
  useEffect(() => {
    let resultado = usuarios;
    
    // Filtrar por tipo de usuário
    if (tipoFiltro !== 'todos') {
      resultado = resultado.filter(user => user.tipoUsuario === tipoFiltro);
    }
    
    // Filtrar por status
    if (statusFiltro !== 'todos') {
      resultado = resultado.filter(user => user.status === statusFiltro);
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      resultado = resultado.filter(
        user => 
          user.nome.toLowerCase().includes(searchLower) || 
          user.email.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredUsuarios(resultado);
  }, [usuarios, tipoFiltro, statusFiltro, searchTerm]);

  // Funções para tratamento de usuários (simuladas)
  const handleAddUser = () => {
    alert('Função para adicionar novo usuário seria implementada aqui');
  };
  
  const handleEditUser = (id: number) => {
    alert(`Função para editar usuário #${id} seria implementada aqui`);
  };
  
  const handleDeleteUser = (id: number) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário #${id}?`)) {
      // Em uma implementação real, isso seria uma chamada API
      setUsuarios(usuarios.filter(user => user.id !== id));
    }
  };

  // Exibir status dos usuários com cores correspondentes
  const renderStatus = (status: 'ativo' | 'inativo' | 'bloqueado') => {
    let bgColor = '';
    let textColor = '';
    
    switch (status) {
      case 'ativo':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'inativo':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'bloqueado':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie todos os usuários da plataforma</p>
        </div>
        
        <button
          onClick={handleAddUser}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
        >
          <UserPlus size={18} className="mr-2" />
          Novo Usuário
        </button>
      </div>
      
      {/* Barra de busca e filtros */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Busca */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 sm:text-sm"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Botão para abrir/fechar filtros */}
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <Filter size={18} className="mr-2 text-gray-500" />
              Filtros
              <ChevronDown size={16} className={`ml-2 text-gray-500 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Contadores */}
            <div className="flex space-x-3">
              <div className="flex items-center bg-purple-50 px-3 py-1 rounded-md">
                <User size={16} className="text-purple-600 mr-2" />
                <span className="text-purple-800 font-medium">{usuarios.filter(u => u.tipoUsuario === 'jogador').length} Jogadores</span>
              </div>
              <div className="flex items-center bg-indigo-50 px-3 py-1 rounded-md">
                <Shield size={16} className="text-indigo-600 mr-2" />
                <span className="text-indigo-800 font-medium">{usuarios.filter(u => u.tipoUsuario === 'admin').length} Admins</span>
              </div>
            </div>
          </div>
          
          {/* Painel de filtros expansível */}
          {isFiltersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="tipoFiltro" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuário
                </label>
                <select
                  id="tipoFiltro"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 sm:text-sm rounded-md"
                  value={tipoFiltro}
                  onChange={e => setTipoFiltro(e.target.value as 'todos' | 'jogador' | 'admin')}
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="jogador">Jogadores</option>
                  <option value="admin">Administradores</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="statusFiltro" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="statusFiltro"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 sm:text-sm rounded-md"
                  value={statusFiltro}
                  onChange={e => setStatusFiltro(e.target.value as 'todos' | 'ativo' | 'inativo' | 'bloqueado')}
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativos</option>
                  <option value="inativo">Inativos</option>
                  <option value="bloqueado">Bloqueados</option>
                </select>
              </div>
            </div>
          )}
        </div>
        
        {/* Tabela de usuários */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
              <span className="ml-3 text-gray-700">Carregando usuários...</span>
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
                <User className="h-6 w-6 text-gray-500" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tente ajustar seus filtros ou adicione um novo usuário.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTipoFiltro('todos');
                    setStatusFiltro('todos');
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Limpar filtros
                </button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Cadastro
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo (R$)
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-800 font-medium text-lg">
                            {usuario.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{usuario.nome}</div>
                          <div className="text-sm text-gray-500">{usuario.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        usuario.tipoUsuario === 'admin' 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {usuario.tipoUsuario === 'admin' ? (
                          <>
                            <Shield size={12} className="mr-1" />
                            Administrador
                          </>
                        ) : (
                          <>
                            <User size={12} className="mr-1" />
                            Jogador
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatus(usuario.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(usuario.dataCadastro).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {usuario.ultimoLogin 
                        ? new Date(usuario.ultimoLogin).toLocaleDateString('pt-BR') 
                        : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {usuario.tipoUsuario === 'jogador' 
                        ? `R$ ${usuario.saldo?.toFixed(2).replace('.', ',') || '0,00'}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(usuario.id)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usuario.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Paginação (simplificada) */}
        {filteredUsuarios.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{filteredUsuarios.length}</span> de <span className="font-medium">{usuarios.length}</span> usuários
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginação">
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Anterior</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    aria-current="page"
                    className="z-10 bg-purple-50 border-purple-500 text-purple-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    1
                  </a>
                  <a
                    href="#"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Próxima</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </a>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 