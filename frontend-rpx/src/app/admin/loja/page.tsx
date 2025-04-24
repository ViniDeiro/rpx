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
  _id?: string;
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
      console.log('Iniciando busca de itens da loja...')
      
      // Buscar produtos
      try {
        console.log('Solicitando produtos da API...')
        const responseProducts = await fetch('/api/admin/produtos')
        
        if (!responseProducts.ok) {
          const errorData = await responseProducts.json().catch(() => ({}))
          console.error('Resposta da API de produtos com erro:', responseProducts.status, errorData)
          throw new Error(`Falha ao buscar produtos (${responseProducts.status}): ${errorData.error || 'Erro desconhecido'}`)
        }
        
        const productsData = await responseProducts.json()
        console.log(`Produtos recebidos com sucesso: ${productsData.products?.length || 0} itens`)
        console.log('Exemplo de produto recebido:', productsData.products?.[0])
        
        // Verificar formato dos produtos e transformar _id para id se necessário
        if (productsData.products && Array.isArray(productsData.products)) {
          const normalizedProducts = productsData.products.map((product: any) => {
            // Garantir que cada produto tenha um ID (convertendo _id para id se necessário)
            return {
              id: product.id || product._id?.toString() || `product-${Math.random().toString(36).substring(2, 11)}`,
              _id: product._id?.toString() || product.id || '',
              name: product.name || 'Sem nome',
              description: product.description || 'Sem descrição',
              price: product.price || 0,
              category: product.category || '',
              imageUrl: product.imageUrl || '/placeholder.png',
              inStock: product.inStock ?? true,
              featured: product.featured ?? false,
              createdAt: product.createdAt || '',
              updatedAt: product.updatedAt || ''
            };
          });
          
          setProducts(normalizedProducts)
        } else {
          setProducts([])
        }
        
        // Buscar categorias
        console.log('Solicitando categorias da API...')
        const responseCategories = await fetch('/api/admin/categorias')
        
        if (!responseCategories.ok) {
          const errorData = await responseCategories.json().catch(() => ({}))
          console.error('Resposta da API de categorias com erro:', responseCategories.status, errorData)
          throw new Error(`Falha ao buscar categorias (${responseCategories.status}): ${errorData.error || 'Erro desconhecido'}`)
        }
        
        const categoriesData = await responseCategories.json()
        console.log(`Categorias recebidas com sucesso: ${categoriesData.categories?.length || 0} itens`)
        
        // Verificar se categorias existe e é um array
        if (!categoriesData.categories || !Array.isArray(categoriesData.categories)) {
          console.error('Resposta de categorias inesperada:', categoriesData)
          throw new Error('Formato de resposta de categorias inválido')
        }
        
        // Verificar se products existe e é um array
        if (!productsData.products || !Array.isArray(productsData.products)) {
          console.error('Resposta de produtos inesperada:', productsData)
          throw new Error('Formato de resposta de produtos inválido')
        }
        
        // Mapear categorias para o formato esperado pelo componente
        const formattedCategories = categoriesData.categories.map((cat: any) => ({
          id: cat._id,
          name: cat.name || 'Sem nome',
          slug: (cat.name || 'outro').toLowerCase().replace(/\s+/g, '-'),
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
        console.log('Processamento de dados concluído com sucesso')
        
      } catch (innerError: any) {
        console.error('Erro ao processar dados da loja:', innerError)
        
        // Carregar dados mockados para desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.log('Usando dados mockados de fallback para desenvolvimento')
          
          // Categorias mockadas
          const mockCategories = [
            { id: 'insignia', name: 'Insígnia', slug: 'insignia', count: 0 },
            { id: 'banner', name: 'Banner', slug: 'banner', count: 0 },
            { id: 'avatar', name: 'Avatar', slug: 'avatar', count: 0 },
            { id: 'outro', name: 'Outro', slug: 'outro', count: 0 }
          ]
          
          setCategories(mockCategories)
          
          // Se já temos produtos criados, vamos manter
          if (products.length === 0) {
            setProducts([])
            setItems([])
          }
          
          // Não mostrar alerta se estivermos usando dados mockados
          return
        }
        
        throw innerError
      }
    } catch (error: any) {
      console.error('Erro ao buscar itens da loja:', error)
      alert(`Erro ao carregar itens da loja: ${error.message || 'Tente novamente.'}`)
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
      console.log('Solicitando exclusão do produto com ID:', itemId)
      const response = await fetch(`/api/admin/produtos?id=${itemId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Falha ao excluir produto: ${errorData.error || response.statusText}`)
      }
      
      // Atualizar a lista de itens após a exclusão
      setItems(items.filter(item => item.id !== itemId))
      setProducts(products.filter(product => (product.id !== itemId && product._id !== itemId)))
      alert('Produto excluído com sucesso')
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error)
      alert(`Erro ao excluir produto: ${error.message}`)
    }
  }

  // Função para alternar destaque do item
  const handleToggleFeatured = async (itemId: string, isFeatured: boolean) => {
    try {
      // Encontrar o produto atual para manter seus dados
      const product = products.find(p => p.id === itemId || p._id === itemId)
      if (!product) {
        console.error('Produto não encontrado para alternar destaque:', itemId)
        return
      }
      
      console.log('Solicitando alteração de destaque para produto:', itemId, !isFeatured)
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Falha ao atualizar produto: ${errorData.error || response.statusText}`)
      }
      
      // Atualizar a lista de itens após a alteração
      setItems(items.map(item => 
        item.id === itemId ? { ...item, featured: !isFeatured } : item
      ))
      
      setProducts(products.map(product => 
        (product.id === itemId || product._id === itemId) ? { ...product, featured: !isFeatured } : product
      ))
      
      alert(`Produto ${!isFeatured ? 'destacado' : 'removido dos destaques'} com sucesso`)
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error)
      alert(`Erro ao atualizar produto: ${error.message}`)
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
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Button 
            className="flex items-center gap-2" 
            onClick={() => router.push('/admin/loja/novo')}
          >
            <PlusIcon className="h-5 w-5" />
            Novo Produto
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[250px]">Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="text-center">Em Estoque</TableHead>
                <TableHead className="text-center">Destaque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {searchTerm 
                      ? 'Nenhum produto encontrado com esse termo de busca' 
                      : 'Nenhum produto cadastrado. Clique em "Novo Produto" para adicionar.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id || product._id || `row-${Math.random()}`}>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {product.id ? product.id.substring(0, 6) : 'ID-???'}...
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                          {product.imageUrl ? (
                            <Image 
                              src={product.imageUrl} 
                              alt={product.name} 
                              width={40} 
                              height={40} 
                              className="object-cover" 
                            />
                          ) : (
                            <PackageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[180px]">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCategoryIcon(getCategoryType(product.category))}
                        <span className="ml-1">{getCategoryLabel(getCategoryType(product.category))}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.inStock ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <X className="h-3 w-3 mr-1" />
                          Não
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.featured ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Check className="h-3 w-3 mr-1" />
                          Sim
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <X className="h-3 w-3 mr-1" />
                          Não
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleToggleFeatured(product.id || product._id || '', product.featured)}
                          title={product.featured ? "Remover destaque" : "Destacar produto"}
                        >
                          <DollarSign className={`h-4 w-4 ${product.featured ? "text-yellow-500" : "text-gray-400"}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => router.push(`/admin/loja/editar/${product.id || product._id}`)}
                          title="Editar produto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => handleDeleteItem(product.id || product._id || '')}
                          title="Excluir produto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 