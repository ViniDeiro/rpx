'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react'

interface EditarProdutoFormProps {
  id: string;
}

export default function EditarProdutoForm({ id }: EditarProdutoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    imageUrl: '/placeholder.png',
    inStock: true,
    featured: false
  })

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/admin/produtos?id=${id}`)
        
        if (!response.ok) {
          throw new Error('Falha ao carregar produto')
        }
        
        const data = await response.json()
        setProduct({
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          category: data.category || '',
          imageUrl: data.imageUrl || '/placeholder.png',
          inStock: data.inStock !== undefined ? data.inStock : true,
          featured: data.featured || false
        })
      } catch (error) {
        console.error('Erro ao carregar produto:', error)
        alert('Erro ao carregar produto. Tente novamente.')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (id) {
      fetchProduct()
    }
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProduct(prev => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProduct(prev => ({ ...prev, [name]: parseFloat(value) }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setProduct(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setProduct(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      
      // Validar dados
      if (!product.name || !product.description || product.price <= 0 || !product.category) {
        alert('Por favor, preencha todos os campos obrigatórios.')
        setIsSubmitting(false)
        return
      }
      
      // Enviar para a API
      const response = await fetch(`/api/admin/produtos?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar produto')
      }
      
      alert('Produto atualizado com sucesso!')
      router.push('/admin/loja')
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      alert('Erro ao atualizar produto. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Mock de categorias para o exemplo
  // Na implementação real, estas seriam carregadas da API
  const categories = [
    { id: 'insignia', name: 'Insígnia' },
    { id: 'banner', name: 'Banner' },
    { id: 'avatar', name: 'Avatar' },
    { id: 'outro', name: 'Outro' }
  ]

  if (isLoading) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            <p className="mt-4 text-gray-500">Carregando produto...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Editar Produto</CardTitle>
          <CardDescription>Atualize as informações do produto existente.</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input 
                id="name"
                name="name"
                value={product.name}
                onChange={handleChange}
                placeholder="Ex: Insígnia de Ouro"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input 
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={product.price}
                onChange={handleNumberChange}
                placeholder="Ex: 99.90"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea 
              id="description"
              name="description"
              value={product.description}
              onChange={handleChange}
              placeholder="Descreva o produto em detalhes..."
              rows={4}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={product.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da Imagem</Label>
              <Input 
                id="imageUrl"
                name="imageUrl"
                value={product.imageUrl}
                onChange={handleChange}
                placeholder="Ex: https://exemplo.com/imagem.jpg"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="inStock"
                checked={product.inStock}
                onCheckedChange={(checked) => handleSwitchChange('inStock', checked)}
              />
              <Label htmlFor="inStock">Em estoque</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="featured"
                checked={product.featured}
                onCheckedChange={(checked) => handleSwitchChange('featured', checked)}
              />
              <Label htmlFor="featured">Produto em destaque</Label>
            </div>
          </div>
          
          <div className="space-y-2 border-t pt-4">
            <Label>Imagem do Produto</Label>
            {product.imageUrl && product.imageUrl !== '/placeholder.png' ? (
              <div className="flex flex-col items-center p-4 border rounded-lg">
                <div className="relative w-full h-48 bg-gray-100 rounded mb-2 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                    <p className="text-gray-500">Imagem do produto</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 truncate max-w-full">{product.imageUrl}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleSelectChange('imageUrl', '')}
                >
                  Alterar Imagem
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Arraste uma imagem ou clique para fazer upload
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG ou GIF até 5MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Selecionar Arquivo
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/loja')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 