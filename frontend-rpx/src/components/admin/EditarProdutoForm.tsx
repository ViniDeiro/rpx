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
import { ArrowLeft, Save, Upload, X, Check, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface EditarProdutoFormProps {
  produtoId: string
}

export default function EditarProdutoForm({ produtoId }: EditarProdutoFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: 0,
    category: '',
    imageUrl: '',
    inStock: true,
    featured: false
  })
  
  // Estados para controle do upload de imagem
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [imageSize, setImageSize] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Buscar dados do produto ao carregar o componente
  useEffect(() => {
    async function fetchProduto() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/admin/produtos?id=${produtoId}`)
        
        if (!response.ok) {
          throw new Error('Falha ao carregar produto')
        }
        
        const data = await response.json()
        
        // Atualizar o estado com os dados do produto
        setProduct({
          name: data.name || '',
          description: data.description || '',
          price: data.price || 0,
          category: data.category || '',
          imageUrl: data.imageUrl || '',
          inStock: data.inStock ?? true,
          featured: data.featured ?? false
        })
        
        // Se já existe uma imagem, configurar o preview
        if (data.imageUrl) {
          setPreview(data.imageUrl)
        }
      } catch (error) {
        console.error('Erro ao carregar produto:', error)
        alert('Erro ao carregar dados do produto. Verifique sua conexão.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProduto()
  }, [produtoId])

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
  
  // Funções para lidar com upload de imagem
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const processFile = async (file: File) => {
    // Verificar se é uma imagem
    if (!file.type.match('image.*')) {
      setImageError('Por favor, envie apenas arquivos de imagem (jpg, png, etc).')
      return
    }

    // Verificar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('A imagem é muito grande. O tamanho máximo é 5MB.')
      return
    }

    try {
      // Criar preview da imagem original
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreview(result)
        
        // Atualizar o estado do produto com a URL da imagem
        setProduct(prev => ({ ...prev, imageUrl: result }))
      }
      reader.readAsDataURL(file)
      
      // Armazenar o arquivo redimensionado
      setSelectedFile(file)
      setImageError(null)
      
      // Exibir tamanho da imagem
      const fileSizeKB = Math.round(file.size / 1024)
      setImageSize(`${fileSizeKB} KB`)
    } catch (error) {
      console.error('Erro ao processar a imagem:', error)
      setImageError('Erro ao processar a imagem. Tente novamente com outra imagem.')
    }
  }

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setSelectedFile(null)
    setImageSize(null)
    setProduct(prev => ({ ...prev, imageUrl: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
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
      
      // Verificar se manteve a imagem atual ou mudou
      if (!product.imageUrl) {
        alert('Por favor, faça upload de uma imagem para o produto.')
        setIsSubmitting(false)
        return
      }
      
      // Log dos dados enviados para debug
      console.log('Enviando dados para atualização:', product)
      
      // Enviar para a API
      const response = await fetch(`/api/admin/produtos?id=${produtoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: Number(product.price),
          category: product.category,
          imageUrl: product.imageUrl,
          inStock: product.inStock,
          featured: product.featured
        })
      })
      
      // Log da resposta para debug
      const responseData = await response.json()
      console.log('Resposta da API:', responseData)
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Falha ao atualizar produto')
      }
      
      alert('Produto atualizado com sucesso!')
      router.push('/admin/loja')
    } catch (error) {
      console.error('Erro ao atualizar produto:', error)
      alert(`Erro ao atualizar produto: ${error instanceof Error ? error.message : 'Tente novamente.'}`)
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
        <CardContent className="p-8 text-center">
          <p>Carregando dados do produto...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Editar Produto</CardTitle>
          <CardDescription>Altere os dados do produto conforme necessário.</CardDescription>
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
            
            <div className="grid grid-cols-1 gap-6">
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
          </div>
          
          <div className="space-y-2">
            <Label>Imagem do Produto *</Label>
            <div
              onClick={!preview ? openFileDialog : undefined}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg transition-colors cursor-pointer
                ${isDragging 
                  ? 'border-purple-500 bg-purple-900/20' 
                  : preview 
                    ? 'border-green-500 bg-green-900/10' 
                    : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50/10'
                }
              `}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {preview ? (
                <div className="relative p-4 flex flex-col items-center">
                  <div className="relative h-48 w-96 mx-auto overflow-hidden rounded-md">
                    <Image
                      src={preview}
                      alt="Preview da imagem"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearFile}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      aria-label="Remover imagem"
                    >
                      <X size={20} />
                    </button>
                    <span className="text-sm text-green-500 flex items-center gap-1">
                      <Check size={16} /> Imagem selecionada
                      {imageSize && <span className="text-xs text-gray-500 ml-1">({imageSize})</span>}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm">
                    Arraste uma imagem ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG ou GIF (máx. 5MB)
                  </p>
                </div>
              )}
            </div>

            {imageError && (
              <p className="mt-2 text-sm text-red-500">{imageError}</p>
            )}
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
            Salvar Alterações
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 