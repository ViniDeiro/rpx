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
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Tag, ShoppingBag, Package, DollarSign, Plus, Edit, Trash2,
  Search, ArrowUpDown, X, Check, Upload, AlertTriangle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  inStock: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export default function LojaAdmin() {
  const router = useRouter()
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: "loading" | "authenticated" | "unauthenticated" }
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<StoreItem[]>([])
  const [activeTab, setActiveTab] = useState('produtos')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    imageUrl: '',
    inStock: true,
    featured: false
  })
  
  // Função para buscar itens da loja
  const fetchItems = async () => {
    try {
      setIsLoading(true)
      
      // Buscar produtos
      const responseProducts = await fetch('/api/admin/produtos')
      if (!responseProducts.ok) {
        throw new Error('Falha ao buscar produtos da loja')
      }
      const productsData = await responseProducts.json()
      setProducts(productsData.products || [])
      
      // Buscar categorias
      const responseCategories = await fetch('/api/admin/categorias')
      if (!responseCategories.ok) {
        throw new Error('Falha ao buscar categorias da loja')
      }
      const categoriesData = await responseCategories.json()
      
      // Mapear categorias para o formato esperado pelo componente
      const formattedCategories = categoriesData.categories.map((cat: any) => ({
        id: cat._id,
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        count: 0 // Será atualizado depois
      }))
      
      // Contar produtos por categoria
      formattedCategories.forEach((cat: Category) => {
        cat.count = productsData.products.filter((p: any) => p.category === cat.id).length
      })
      
      setCategories(formattedCategories)
      
      // Mapear produtos para o formato de StoreItem para compatibilidade com o componente atual
      const storeItems = productsData.products.map((product: any) => ({
        id: product._id,
        name: product.name || 'Sem nome',
        description: product.description || 'Sem descrição',
        price: product.price || 0,
        image: product.imageUrl || '/placeholder.png',
        category: getCategoryType(product.category),
        stock: product.inStock ? 10 : 0, // Usamos inStock como indicador
        featured: product.featured || false
      }))
      
      setItems(storeItems)
    } catch (error) {
      console.error('Erro ao buscar itens da loja:', error)
      alert('Erro ao carregar itens da loja. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Função auxiliar para mapear categorias para os tipos esperados
  const getCategoryType = (categoryId: string): StoreItem['category'] => {
    // Aqui você pode implementar uma lógica baseada nas suas categorias reais
    // Por enquanto, vamos retornar 'outro' como padrão
    return 'outro'
  }

  // Função para excluir um item
  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return
    
    try {
      const response = await fetch(`/api/admin/produtos?id=${itemId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Falha ao excluir produto')
      }
      
      // Atualizar a lista de itens após a exclusão
      setItems(items.filter(item => item.id !== itemId))
      setProducts(products.filter(product => product.id !== itemId))
      alert('Produto excluído com sucesso')
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      alert('Erro ao excluir produto. Tente novamente.')
    }
  }

  // Função para alternar destaque do item
  const handleToggleFeatured = async (itemId: string, isFeatured: boolean) => {
    try {
      // Encontrar o produto atual para manter seus dados
      const product = products.find(p => p.id === itemId)
      if (!product) return
      
      const response = await fetch(`/api/admin/produtos?id=${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...product,
          featured: !isFeatured
        })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar produto')
      }
      
      // Atualizar a lista de itens após a alteração
      setItems(items.map(item => 
        item.id === itemId ? { ...item, featured: !isFeatured } : item
      ))
      
      setProducts(products.map(product => 
        product.id === itemId ? { ...product, featured: !isFeatured } : product
      ))
      
      alert(`Produto ${!isFeatured ? 'destacado' : 'removido dos destaques'} com sucesso`)
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      alert('Erro ao atualizar produto. Tente novamente.')
    }
  }

  useEffect(() => {
    // BYPASS DE AUTENTICAÇÃO PARA DESENVOLVIMENTO
    // Em desenvolvimento, considerar sempre como admin
    setIsAdmin(true);
    setIsLoading(false);
    fetchItems();
    
    // Código original comentado:
    /*
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
    */
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

  // Função para carregar dados
  const loadData = async () => {
    // Esta função está sendo substituída pelo fetchItems
    // Mantida para compatibilidade, mas agora apenas chama fetchItems
    fetchItems()
  }

  // Função para filtrar produtos por termo de busca
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
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
                    onClick={() => router.push(`/admin/loja/editar/${item.id}`)}
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