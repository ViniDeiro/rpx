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
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: "loading" | "authenticated" | "unauthenticated" }
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  
  // Função para buscar usuários da API
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Falha ao buscar usuários')
      }
      const data = await response.json()
      setUsers(data.map((user: any) => ({
        id: user.id,
        name: user.name || 'Sem nome',
        email: user.email || 'Sem e-mail',
        username: user.username || 'Sem username',
        isAdmin: user.isAdmin || user.role === 'admin' || false,
        createdAt: user.createdAt || new Date().toISOString()
      })))
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      alert('Erro ao carregar usuários. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

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
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
    if (status === 'loading') return

    if (!session || !session.user) {
      router.push('/login')
      return
    }

    if (session.user.isAdmin) {
      setIsAdmin(true)
      // Buscar usuários da API
      fetchUsers()
    } else {
      router.push('/')
    }
  }, [session, status, router])

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

  if (!isAdmin) {
    return null
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
                          <span>{user.isAdmin ? 'Remover admin' : 'Tornar admin'}</span>
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
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 