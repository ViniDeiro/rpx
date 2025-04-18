'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { 
  PlusIcon, 
  MoreVerticalIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  ShoppingBagIcon,
  TagIcon,
  PackageIcon
} from 'lucide-react'
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

// Interface para item da loja
interface StoreItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: 'insignia' | 'banner' | 'avatar' | 'outro'
  stock: number
  featured: boolean
}

export default function LojaAdmin() {
  const router = useRouter()
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: "loading" | "authenticated" | "unauthenticated" }
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<StoreItem[]>([])
  
  // Função para buscar itens da loja
  const fetchItems = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/store')
      if (!response.ok) {
        throw new Error('Falha ao buscar itens da loja')
      }
      const data = await response.json()
      
      // Mapear os dados recebidos para o formato esperado pelo componente
      setItems(data.map((item: any) => ({
        id: item.id,
        name: item.name || 'Sem nome',
        description: item.description || 'Sem descrição',
        price: item.price || 0,
        image: item.image || '/placeholder.png',
        category: item.category || 'outro',
        stock: item.stock || 0,
        featured: item.featured || false
      })))
    } catch (error) {
      console.error('Erro ao buscar itens da loja:', error)
      alert('Erro ao carregar itens da loja. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para excluir um item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return
    
    try {
      const response = await fetch(`/api/admin/store?id=${itemId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao excluir item')
      }
      
      // Atualizar a lista de itens após a exclusão
      setItems(items.filter(item => item.id !== itemId))
      alert('Item excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir item:', error)
      alert('Erro ao excluir item. Tente novamente.')
    }
  }

  // Função para alternar destaque do item
  const handleToggleFeatured = async (itemId: string, isFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/store?id=${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          featured: !isFeatured
        })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar item')
      }
      
      // Atualizar a lista de itens após a alteração
      setItems(items.map(item => 
        item.id === itemId ? { ...item, featured: !isFeatured } : item
      ))
      
      alert(`Item ${!isFeatured ? 'destacado' : 'removido dos destaques'} com sucesso`)
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      alert('Erro ao atualizar item. Tente novamente.')
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
      // Buscar itens da API
      fetchItems()
    } else {
      router.push('/')
    }
  }, [session, status, router])

  const getCategoryIcon = (category: StoreItem['category']) => {
    switch (category) {
      case 'insignia':
        return <TagIcon className="h-5 w-5 text-purple-500" />
      case 'banner':
        return <PackageIcon className="h-5 w-5 text-blue-500" />
      case 'avatar':
        return <ShoppingBagIcon className="h-5 w-5 text-green-500" />
      default:
        return <ShoppingBagIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getCategoryLabel = (category: StoreItem['category']) => {
    switch (category) {
      case 'insignia':
        return 'Insígnia'
      case 'banner':
        return 'Banner'
      case 'avatar':
        return 'Avatar'
      default:
        return 'Outro'
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
          <h1 className="text-3xl font-bold">Gerenciamento da Loja</h1>
          <p className="text-gray-500 mt-1">Gerencie os itens disponíveis na loja da plataforma RPX</p>
        </div>
        <Button onClick={() => router.push('/admin')}>
          Voltar para Dashboard
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-600">Total de Itens</p>
            <p className="text-2xl font-bold text-blue-800">{items.length}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm text-purple-600">Insígnias</p>
            <p className="text-2xl font-bold text-purple-800">{items.filter(item => item.category === 'insignia').length}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-600">Avatares</p>
            <p className="text-2xl font-bold text-green-800">{items.filter(item => item.category === 'avatar').length}</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg">
            <p className="text-sm text-indigo-600">Banners</p>
            <p className="text-2xl font-bold text-indigo-800">{items.filter(item => item.category === 'banner').length}</p>
          </div>
        </div>
        
        <Button className="flex items-center gap-2" onClick={() => router.push('/admin/loja/novo')}>
          <PlusIcon className="h-5 w-5" />
          Novo Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200 relative">
              {/* Em produção, use a imagem real do item */}
              <div className="flex items-center justify-center h-full bg-gradient-to-r from-blue-500 to-purple-500">
                {getCategoryIcon(item.category)}
                <span className="ml-2 text-white font-semibold">{item.name}</span>
              </div>
              
              {item.featured && (
                <Badge className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                  Destaque
                </Badge>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <Badge className="mt-1" variant="outline">
                    {getCategoryIcon(item.category)}
                    <span className="ml-1">{getCategoryLabel(item.category)}</span>
                  </Badge>
                </div>
                <span className="font-bold text-lg text-green-600">
                  R$ {item.price.toLocaleString('pt-BR')}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">{item.description}</p>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Estoque: <span className="font-semibold">{item.stock}</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => router.push(`/admin/loja/${item.id}`)}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => router.push(`/admin/loja/editar?id=${item.id}`)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 