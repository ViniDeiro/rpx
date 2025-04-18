'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
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
import { PlusIcon, MoreVerticalIcon, PencilIcon, TrashIcon, EyeIcon, TrophyIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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

// Interface para torneio
interface Tournament {
  id: string
  name: string
  game: string
  startDate: string
  endDate: string
  maxParticipants: number
  currentParticipants: number
  entryFee: number
  prizePool: number
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
}

export default function TorneiosAdmin() {
  const router = useRouter()
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: "loading" | "authenticated" | "unauthenticated" }
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  
  // Função para buscar torneios da API
  const fetchTournaments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/tournaments')
      if (!response.ok) {
        throw new Error('Falha ao buscar torneios')
      }
      const data = await response.json()
      
      // Mapear os dados recebidos para o formato esperado pelo componente
      setTournaments(data.map((tournament: any) => ({
        id: tournament.id,
        name: tournament.name || 'Sem nome',
        game: tournament.game || 'Free Fire',
        startDate: tournament.startDate || new Date().toISOString(),
        endDate: tournament.endDate || new Date().toISOString(),
        maxParticipants: tournament.maxParticipants || 100,
        currentParticipants: tournament.currentParticipants || 0,
        entryFee: tournament.entryFee || 0,
        prizePool: tournament.prizePool || 0,
        status: tournament.status || 'upcoming'
      })))
    } catch (error) {
      console.error('Erro ao buscar torneios:', error)
      alert('Erro ao carregar torneios. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para excluir um torneio
  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este torneio?')) return
    
    try {
      const response = await fetch(`/api/admin/tournaments?id=${tournamentId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao excluir torneio')
      }
      
      // Atualizar a lista de torneios após a exclusão
      setTournaments(tournaments.filter(t => t.id !== tournamentId))
      alert('Torneio excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir torneio:', error)
      alert('Erro ao excluir torneio. Tente novamente.')
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
      // Buscar torneios da API
      fetchTournaments()
    } else {
      router.push('/')
    }
  }, [session, status, router])

  const getStatusBadge = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Em breve</Badge>
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Concluído</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>
      default:
        return null
    }
  }

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
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Torneios</h1>
          <p className="text-gray-500 mt-1">Crie e gerencie torneios da plataforma RPX</p>
        </div>
        <Button onClick={() => router.push('/admin')}>
          Voltar para Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-600">Total de Torneios</p>
            <p className="text-2xl font-bold text-blue-800">{tournaments.length}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-600">Torneios Ativos</p>
            <p className="text-2xl font-bold text-green-800">{tournaments.filter(t => t.status === 'active').length}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm text-purple-600">Premiação Total</p>
            <p className="text-2xl font-bold text-purple-800">R$ {tournaments.reduce((total, t) => total + t.prizePool, 0).toLocaleString('pt-BR')}</p>
          </div>
        </div>
        
        <Button className="flex items-center gap-2" onClick={() => router.push('/admin/torneios/novo')}>
          <PlusIcon className="h-5 w-5" />
          Novo Torneio
        </Button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome do Torneio</TableHead>
              <TableHead>Datas</TableHead>
              <TableHead>Participantes</TableHead>
              <TableHead>Taxa de Entrada</TableHead>
              <TableHead>Premiação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.map((tournament) => (
              <TableRow key={tournament.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <TrophyIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <div>
                      <div>{tournament.name}</div>
                      <div className="text-sm text-gray-500">{tournament.game}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>Início: {new Date(tournament.startDate).toLocaleDateString('pt-BR')}</div>
                    <div>Término: {new Date(tournament.endDate).toLocaleDateString('pt-BR')}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(tournament.currentParticipants / tournament.maxParticipants) * 100}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">{tournament.currentParticipants}/{tournament.maxParticipants}</span>
                  </div>
                </TableCell>
                <TableCell>R$ {tournament.entryFee.toLocaleString('pt-BR')}</TableCell>
                <TableCell>R$ {tournament.prizePool.toLocaleString('pt-BR')}</TableCell>
                <TableCell>{getStatusBadge(tournament.status)}</TableCell>
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
                        onClick={() => router.push(`/admin/torneios/${tournament.id}`)}
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Visualizar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={() => router.push(`/admin/torneios/editar?id=${tournament.id}`)}
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-red-600"
                        onClick={() => handleDeleteTournament(tournament.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 