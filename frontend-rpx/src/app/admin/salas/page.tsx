'use client';

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  GamepadIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  EyeOffIcon,
  SearchIcon,
} from 'lucide-react'

// Componentes UI - usando caminhos relativos corretos
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from '@/components/ui/label'

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

// Interface para salas do Free Fire
interface FFRoom {
  id: string
  roomId: string
  roomPassword: string
  tournamentId?: string
  matchId?: string
  tournamentName?: string
  status: 'disponivel' | 'em_uso' | 'expirada'
  createdAt: string
  expiresAt?: string
}

export default function SalasAdmin() {
  const router = useRouter()
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: "loading" | "authenticated" | "unauthenticated" }
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [rooms, setRooms] = useState<FFRoom[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<FFRoom | null>(null)
  const [newRoom, setNewRoom] = useState({
    roomId: '',
    roomPassword: '',
    tournamentId: '',
    tournamentName: '',
  })
  
  // Função para buscar salas
  const fetchRooms = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/salas')
      if (!response.ok) {
        throw new Error('Falha ao carregar salas')
      }
      const data = await response.json()
      setRooms(data.map((room: any) => ({
        id: room._id || room.id,
        roomId: room.roomId,
        roomPassword: room.roomPassword,
        tournamentId: room.tournamentId,
        tournamentName: room.tournamentName,
        status: room.status || 'disponivel',
        createdAt: room.createdAt,
        expiresAt: room.expiresAt
      })))
    } catch (error) {
      console.error('Erro ao buscar salas:', error)
      alert('Erro ao carregar salas. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para criar sala
  const handleCreateRoom = async () => {
    try {
      const response = await fetch('/api/admin/salas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Sala ${newRoom.roomId}`,
          roomId: newRoom.roomId,
          roomPassword: newRoom.roomPassword,
          tournamentId: newRoom.tournamentId || undefined,
          tournamentName: newRoom.tournamentName || undefined,
          status: 'disponivel'
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao criar sala')
      }

      // Recarregar salas após criação
      fetchRooms()
      setIsDialogOpen(false)
      setNewRoom({
        roomId: '',
        roomPassword: '',
        tournamentId: '',
        tournamentName: '',
      })
      alert('Sala criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar sala:', error)
      alert('Erro ao criar sala. Tente novamente.')
    }
  }

  // Função para editar sala
  const handleEditRoom = async () => {
    if (!currentRoom) return
    
    try {
      const response = await fetch(`/api/admin/salas?id=${currentRoom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Sala ${currentRoom.roomId}`,
          roomId: currentRoom.roomId,
          roomPassword: currentRoom.roomPassword,
          tournamentId: currentRoom.tournamentId || undefined,
          tournamentName: currentRoom.tournamentName || undefined,
          status: currentRoom.status
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar sala')
      }

      // Recarregar salas após edição
      fetchRooms()
      setCurrentRoom(null)
      setIsDialogOpen(false)
      alert('Sala atualizada com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar sala:', error)
      alert('Erro ao atualizar sala. Tente novamente.')
    }
  }

  // Função para excluir sala
  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sala?')) return
    
    try {
      const response = await fetch(`/api/admin/salas?id=${roomId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Falha ao excluir sala')
      }

      // Recarregar salas após exclusão
      fetchRooms()
      alert('Sala excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir sala:', error)
      alert('Erro ao excluir sala. Tente novamente.')
    }
  }

  // Função para mudar status da sala
  const handleRoomStatusChange = async (roomId: string, status: FFRoom['status']) => {
    try {
      // Encontrar a sala atual
      const room = rooms.find(r => r.id === roomId)
      if (!room) return
      
      const response = await fetch(`/api/admin/salas?id=${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Sala ${room.roomId}`,
          roomId: room.roomId,
          roomPassword: room.roomPassword,
          tournamentId: room.tournamentId,
          tournamentName: room.tournamentName,
          status: status
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar status da sala')
      }

      // Recarregar salas após edição
      fetchRooms()
    } catch (error) {
      console.error('Erro ao atualizar status da sala:', error)
      alert('Erro ao atualizar status. Tente novamente.')
    }
  }

  const togglePasswordVisibility = (roomId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }))
  }

  const openEditDialog = (room: FFRoom) => {
    setCurrentRoom(room)
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setCurrentRoom(null)
    setIsDialogOpen(true)
  }

  useEffect(() => {
    if (status === 'loading') return

    if (!session || !session.user) {
      router.push('/login')
      return
    }

    if (session.user.isAdmin) {
      setIsAdmin(true)
      // Buscar salas da API
      fetchRooms()
    } else {
      router.push('/')
    }
  }, [session, status, router])

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusBadge = (roomStatus: FFRoom['status']) => {
    switch (roomStatus) {
      case 'disponivel':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Disponível
        </Badge>
      case 'em_uso':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
          Em Uso
        </Badge>
      case 'expirada':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Expirada
        </Badge>
      default:
        return null
    }
  }

  const filteredRooms = rooms.filter(room => {
    const matchesStatus = statusFilter === 'todos' || room.status === statusFilter
    const matchesSearch = 
      room.roomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.tournamentName?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    
    return matchesStatus && matchesSearch
  })

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
          <h1 className="text-3xl font-bold">Gerenciamento de Salas Free Fire</h1>
          <p className="text-gray-500 mt-1">Configure IDs e senhas de salas para torneios</p>
        </div>
        <Button onClick={() => router.push('/admin')}>
          Voltar para Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Total de Salas</p>
          <p className="text-2xl font-bold text-blue-800">{rooms.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Salas Disponíveis</p>
          <p className="text-2xl font-bold text-green-800">
            {rooms.filter(r => r.status === 'disponivel').length}
          </p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-sm text-blue-700">Salas Em Uso</p>
          <p className="text-2xl font-bold text-blue-900">
            {rooms.filter(r => r.status === 'em_uso').length}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:w-auto">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            className="pl-9 w-full sm:w-64"
            placeholder="Buscar por ID ou torneio..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="disponivel">Disponíveis</SelectItem>
              <SelectItem value="em_uso">Em Uso</SelectItem>
              <SelectItem value="expirada">Expiradas</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={openCreateDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Nova Sala
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => (
          <Card key={room.id} className={`
            ${room.status === 'disponivel' ? 'border-green-200' : ''}
            ${room.status === 'em_uso' ? 'border-blue-200' : ''}
            ${room.status === 'expirada' ? 'border-red-200' : ''}
          `}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <GamepadIcon className="h-5 w-5 mr-2 text-blue-500" />
                    Sala #{room.id}
                  </CardTitle>
                  <CardDescription>
                    Criada em {formatDate(room.createdAt)}
                  </CardDescription>
                </div>
                {getStatusBadge(room.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">ID da Sala</Label>
                  <div className="font-medium">{room.roomId}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Senha</Label>
                  <div className="font-medium flex items-center">
                    {showPasswords[room.id] ? room.roomPassword : '••••••••'}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2 h-6 w-6 p-0"
                      onClick={() => togglePasswordVisibility(room.id)}
                    >
                      {showPasswords[room.id] ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {room.tournamentName && (
                  <div>
                    <Label className="text-xs text-gray-500">Torneio</Label>
                    <div className="font-medium">{room.tournamentName}</div>
                  </div>
                )}
                {room.expiresAt && (
                  <div>
                    <Label className="text-xs text-gray-500">Expira em</Label>
                    <div className="font-medium">{formatDate(room.expiresAt)}</div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditDialog(room)}
                >
                  <EditIcon className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteRoom(room.id)}
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
              {room.status !== 'expirada' && (
                <Select
                  value={room.status}
                  onValueChange={(value) => 
                    handleRoomStatusChange(room.id, value as FFRoom['status'])
                  }
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_uso">Em Uso</SelectItem>
                    <SelectItem value="expirada">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentRoom ? 'Editar Sala' : 'Criar Nova Sala'}
            </DialogTitle>
            <DialogDescription>
              {currentRoom 
                ? 'Atualize os detalhes da sala do Free Fire'
                : 'Preencha os detalhes para criar uma nova sala'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomId" className="text-right">
                ID da Sala
              </Label>
              <Input
                id="roomId"
                className="col-span-3"
                value={currentRoom ? currentRoom.roomId : newRoom.roomId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  currentRoom 
                    ? setCurrentRoom({...currentRoom, roomId: e.target.value})
                    : setNewRoom({...newRoom, roomId: e.target.value})
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomPassword" className="text-right">
                Senha
              </Label>
              <Input
                id="roomPassword"
                className="col-span-3"
                value={currentRoom ? currentRoom.roomPassword : newRoom.roomPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  currentRoom 
                    ? setCurrentRoom({...currentRoom, roomPassword: e.target.value})
                    : setNewRoom({...newRoom, roomPassword: e.target.value})
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tournamentId" className="text-right">
                ID do Torneio
              </Label>
              <Input
                id="tournamentId"
                className="col-span-3"
                value={currentRoom ? currentRoom.tournamentId || '' : newRoom.tournamentId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  currentRoom 
                    ? setCurrentRoom({...currentRoom, tournamentId: e.target.value})
                    : setNewRoom({...newRoom, tournamentId: e.target.value})
                }
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tournamentName" className="text-right">
                Nome do Torneio
              </Label>
              <Input
                id="tournamentName"
                className="col-span-3"
                value={currentRoom ? currentRoom.tournamentName || '' : newRoom.tournamentName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  currentRoom 
                    ? setCurrentRoom({...currentRoom, tournamentName: e.target.value})
                    : setNewRoom({...newRoom, tournamentName: e.target.value})
                }
              />
            </div>
            {currentRoom && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={currentRoom.status}
                  onValueChange={(value) => 
                    setCurrentRoom({...currentRoom, status: value as FFRoom['status']})
                  }
                >
                  <SelectTrigger id="status" className="col-span-3">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_uso">Em Uso</SelectItem>
                    <SelectItem value="expirada">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={currentRoom ? handleEditRoom : handleCreateRoom}
              disabled={
                currentRoom 
                  ? !currentRoom.roomId || !currentRoom.roomPassword
                  : !newRoom.roomId || !newRoom.roomPassword
              }
            >
              {currentRoom ? 'Salvar Alterações' : 'Criar Sala'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 