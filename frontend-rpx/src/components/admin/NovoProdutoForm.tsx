'use client'

import React, { useState } from 'react'
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
import { ArrowLeft, Save, Upload } from 'lucide-react'

export default function NovoProdutoForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    imageUrl: '/placeholder.png',
    inStock: true,
    featured: false
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProduct(prev => ({ ...prev, [name]: value }))
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
      const response = await fetch('/api/admin/produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
      })
      
      if (!response.ok) {
        throw new Error('Falha ao criar produto')
      }
      
      alert('Produto criado com sucesso!')
      router.push('/admin/loja')
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      alert('Erro ao criar produto. Tente novamente.')
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

  return (
    <Card className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
          <CardDescription>Preencha os dados do novo produto que deseja adicionar à loja.</CardDescription>
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
                onChange={handleChange}
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
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/loja')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Produto
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 