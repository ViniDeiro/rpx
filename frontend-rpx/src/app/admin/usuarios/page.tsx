'use client';

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PencilIcon, MoreVerticalIcon, UserPlusIcon, SearchIcon, TrashIcon, ShieldIcon } from 'lucide-react'

// Interface para usuário no sistema
interface User {
  id: string
  name: string
  email: string
  username: string
  isAdmin: boolean
  createdAt: string
}

export default function UsuariosAdmin() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [authError, setAuthError] = useState(false)
  
  // Função para buscar usuários da API
  const fetchUsers = async () => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptFetch = async () => {
      try {
        setIsLoading(true);
        console.log('Realizando requisição para buscar usuários...');
        
        const response = await fetch('/api/admin/users', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          credentials: 'include' // Importante: incluir cookies de autenticação
        });
        
        // Verificar erros de autenticação/autorização
        if (response.status === 401 || response.status === 403) {
          const errorData = await response.json();
          console.error('Erro de autorização:', errorData);
          setAuthError(true);
          throw new Error(`Acesso negado: ${errorData.error || 'Você não tem permissão para acessar esta página'}`);
        }
        
        if (!response.ok) {
          console.error('Erro na resposta da API:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Detalhes do erro:', errorText);
          throw new Error(`Falha ao buscar usuários: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Dados recebidos da API:', data);
        console.log('Quantidade de usuários recebidos:', Array.isArray(data) ? data.length : 'Dados não são um array');
        
        // Verificar se os dados são um array
        if (!Array.isArray(data)) {
          console.error('Formato de dados inválido:', data);
          throw new Error('Resposta da API não retornou uma lista de usuários.');
        }
        
        // Log detalhado para debug
        if (data.length === 0) {
          console.warn('Lista de usuários vazia retornada da API');
        } else {
          console.log('Primeiro usuário na lista:', data[0]);
        }
        
        // Formatar os dados dos usuários
        const formattedUsers = data.map((user: any, index: number) => {
          const formattedUser = {
            id: user._id || user.id || `temp-id-${index}`,
            name: user.name || user.username || 'Sem nome',
            email: user.email || 'Sem e-mail',
            username: user.username || 'Sem username',
            isAdmin: user.isAdmin || user.role === 'admin' || false,
            createdAt: user.createdAt || new Date().toISOString()
          };
          console.log(`Usuário ${index+1} formatado:`, formattedUser);
          return formattedUser;
        });
        
        console.log('Total de usuários formatados:', formattedUsers.length);
        setUsers(formattedUsers);
        
        setAuthError(false); // Limpar erros de autenticação caso a requisição tenha sucesso
        console.log('Usuários carregados com sucesso.');
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        
        // Verificar se é erro de autenticação
        if (error instanceof Error && error.message.includes('Acesso negado')) {
          setAuthError(true);
          alert(`Erro de autorização: ${error.message}`);
          return; // Não tentar novamente para erros de autorização
        }
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Tentativa ${retryCount} de ${maxRetries}...`);
          // Esperar um tempo antes de tentar novamente (tempo cresce exponencialmente)
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptFetch();
        } else {
          // Após várias tentativas, informar o erro ao usuário
          alert('Erro ao carregar usuários. Tente novamente.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    await attemptFetch();
  };

  // Função para excluir um usuário
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao excluir usuário')
      }
      
      // Atualizar a lista de usuários após a exclusão
      setUsers(users.filter(user => user.id !== userId))
      alert('Usuário excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      alert('Erro ao excluir usuário. Tente novamente.')
    }
  }

  // Função para alterar status de administrador
  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      const response = await fetch(`/api/admin/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: userId,
          isAdmin: !isCurrentlyAdmin
        })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar status de administrador')
      }
      
      // Atualizar a lista de usuários após a alteração
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, isAdmin: !isCurrentlyAdmin } 
          : user
      ))
      
      alert(`Usuário ${!isCurrentlyAdmin ? 'promovido a' : 'removido de'} administrador com sucesso`)
    } catch (error) {
      console.error('Erro ao atualizar status de administrador:', error)
      alert('Erro ao atualizar status de administrador. Tente novamente.')
    }
  }

  useEffect(() => {
    // O layout já trata de verificar se o usuário é admin
    // Aqui apenas carregar os dados que precisamos
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-red-50 p-8 rounded-lg shadow">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-700 mb-4">Acesso Negado</h2>
          <p className="text-center max-w-md mb-6">
            Você não possui permissões de administrador para acessar esta página. 
            Verifique se sua conta tem os privilégios necessários.
          </p>
          <Button 
            onClick={() => router.push('/')}
            className="bg-red-600 hover:bg-red-700"
          >
            Voltar para página inicial
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <Button onClick={() => router.push('/admin')}>
          Voltar para Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <Button className="flex items-center gap-2" onClick={() => router.push('/admin/usuarios/novo')}>
          <UserPlusIcon className="h-5 w-5" />
          Adicionar Usuário
        </Button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>Administrador</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Administrador
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Usuário
                      </span>
                    )}
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
                          onClick={() => router.push(`/admin/usuarios/editar?id=${user.id}`)}
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2"
                          onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                        >
                          <ShieldIcon className="h-4 w-4" />
                          <span>{user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center gap-2 text-red-600"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span>Excluir</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-gray-500">
                  {searchTerm ? 'Nenhum usuário encontrado com os critérios de busca.' : 'Nenhum usuário cadastrado.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 