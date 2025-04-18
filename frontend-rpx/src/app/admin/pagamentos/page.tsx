'use client';

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  CreditCard, 
  PlusCircle, 
  Edit, 
  Trash2, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ChevronsUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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

// Interface para Gateway de Pagamento
interface PaymentGateway {
  id: string;
  name: string;
  gateway: 'mercadopago' | 'pix' | 'pagseguro' | 'stripe';
  apiKey: string;
  apiSecret?: string;
  sandboxMode: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PagamentosAdmin() {
  const router = useRouter()
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: "loading" | "authenticated" | "unauthenticated" }
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState<Partial<PaymentGateway>>({
    name: '',
    gateway: 'mercadopago',
    apiKey: '',
    apiSecret: '',
    sandboxMode: true,
    isActive: true
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Função para buscar gateways de pagamento
  const fetchGateways = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/payment-methods')
      if (!response.ok) {
        throw new Error('Falha ao carregar métodos de pagamento')
      }
      const data = await response.json()
      setGateways(data)
    } catch (error) {
      console.error('Erro ao buscar métodos de pagamento:', error)
      setErrorMessage('Erro ao carregar métodos de pagamento. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para salvar método de pagamento (criar ou atualizar)
  const handleSaveGateway = async () => {
    try {
      if (!formData.name || !formData.gateway || !formData.apiKey) {
        setErrorMessage('Preencha todos os campos obrigatórios.')
        return
      }
      
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/admin/payment-methods?id=${editingId}` : '/api/admin/payment-methods'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Falha ao salvar método de pagamento')
      }

      setSuccessMessage(`Método de pagamento ${editingId ? 'atualizado' : 'adicionado'} com sucesso!`)
      setIsDialogOpen(false)
      resetForm()
      fetchGateways()
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
      
    } catch (error: any) {
      console.error('Erro ao salvar método de pagamento:', error)
      setErrorMessage(error.message || 'Erro ao salvar método de pagamento. Tente novamente.')
    }
  }

  // Função para excluir um método de pagamento
  const handleDeleteGateway = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este método de pagamento?')) return
    
    try {
      const response = await fetch(`/api/admin/payment-methods?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Falha ao excluir método de pagamento')
      }

      setSuccessMessage('Método de pagamento excluído com sucesso!')
      fetchGateways()
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('Erro ao excluir método de pagamento:', error)
      setErrorMessage('Erro ao excluir método de pagamento. Tente novamente.')
    }
  }

  // Função para alternar status ativo/inativo
  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/payment-methods?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentValue
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar status')
      }

      setSuccessMessage(`Método de pagamento ${!currentValue ? 'ativado' : 'desativado'} com sucesso!`)
      fetchGateways()
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      setErrorMessage('Erro ao atualizar status. Tente novamente.')
    }
  }

  // Função para alternar modo sandbox/produção
  const handleToggleSandbox = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/payment-methods?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sandboxMode: !currentValue
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar modo de ambiente')
      }

      setSuccessMessage(`Modo ${!currentValue ? 'Sandbox' : 'Produção'} ativado com sucesso!`)
      fetchGateways()
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('Erro ao atualizar modo de ambiente:', error)
      setErrorMessage('Erro ao atualizar modo de ambiente. Tente novamente.')
    }
  }

  // Abrir diálogo para edição
  const openEditDialog = (gateway: PaymentGateway) => {
    setFormData({
      name: gateway.name,
      gateway: gateway.gateway,
      apiKey: gateway.apiKey,
      apiSecret: gateway.apiSecret || '',
      sandboxMode: gateway.sandboxMode,
      isActive: gateway.isActive
    })
    setEditingId(gateway.id)
    setIsDialogOpen(true)
  }

  // Abrir diálogo para criação
  const openCreateDialog = () => {
    resetForm()
    setEditingId(null)
    setIsDialogOpen(true)
  }

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      name: '',
      gateway: 'mercadopago',
      apiKey: '',
      apiSecret: '',
      sandboxMode: true,
      isActive: true
    })
    setErrorMessage('')
  }

  // Obter título da gateway
  const getGatewayLabel = (gateway: PaymentGateway['gateway']) => {
    switch (gateway) {
      case 'mercadopago': return 'MercadoPago'
      case 'pix': return 'PIX Direto'
      case 'pagseguro': return 'PagSeguro'
      case 'stripe': return 'Stripe'
      default: return gateway
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
      // Buscar métodos de pagamento
      fetchGateways()
    } else {
      router.push('/')
    }
  }, [session, status, router])

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
          <h1 className="text-3xl font-bold">Métodos de Pagamento</h1>
          <p className="text-gray-500 mt-1">Configure gateways de pagamento para a plataforma</p>
        </div>
        <Button onClick={() => router.push('/admin')}>
          Voltar para Dashboard
        </Button>
      </div>

      {/* Mensagens de sucesso e erro */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6">
          <span className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {successMessage}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {errorMessage}
          </span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
            onClick={() => setErrorMessage('')}
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="grid gap-6 mb-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {gateways.length === 0 ? (
              <span>Nenhum método de pagamento configurado.</span>
            ) : (
              <span>{gateways.length} método(s) de pagamento configurado(s).</span>
            )}
          </div>
          <Button onClick={openCreateDialog} className="flex items-center">
            <PlusCircle className="h-5 w-5 mr-2" />
            Adicionar Gateway
          </Button>
        </div>

        <div className="space-y-4">
          {gateways.map((gateway) => (
            <Card key={gateway.id} className={gateway.isActive ? "border-green-200" : "border-gray-200"}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center text-xl">
                      <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
                      {gateway.name}
                    </CardTitle>
                    <CardDescription>
                      Gateway: {getGatewayLabel(gateway.gateway)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {gateway.sandboxMode ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                        Modo Sandbox
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                        Produção
                      </Badge>
                    )}
                    
                    {gateway.isActive ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <Collapsible className="w-full">
                <CardContent className="pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                      <div className="text-sm">
                        <span className="text-gray-500">Última atualização: </span>
                        <span className="font-medium">
                          {new Date(gateway.updatedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Detalhes <ChevronsUpDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardContent>
                
                <CollapsibleContent>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-500">Chave API</Label>
                        <div className="font-medium text-sm font-mono bg-gray-50 p-2 rounded border">
                          ••••••••••••••••••
                        </div>
                      </div>
                      
                      {gateway.apiSecret && (
                        <div>
                          <Label className="text-xs text-gray-500">Chave Secreta</Label>
                          <div className="font-medium text-sm font-mono bg-gray-50 p-2 rounded border">
                            ••••••••••••••••••
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Modo Sandbox</Label>
                          <Switch
                            checked={gateway.sandboxMode}
                            onCheckedChange={() => handleToggleSandbox(gateway.id, gateway.sandboxMode)}
                          />
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {gateway.sandboxMode 
                            ? "Ativo: Transações são simuladas, não há cobrança real." 
                            : "Desativado: As transações são reais e os pagamentos serão processados."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
                
                <CardFooter className="pt-4">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(gateway)}
                        className="gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 gap-1"
                        onClick={() => handleDeleteGateway(gateway.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="mr-2 text-sm">
                        {gateway.isActive ? "Ativo" : "Inativo"}
                      </Label>
                      <Switch
                        checked={gateway.isActive}
                        onCheckedChange={() => handleToggleActive(gateway.id, gateway.isActive)}
                      />
                    </div>
                  </div>
                </CardFooter>
              </Collapsible>
            </Card>
          ))}

          {gateways.length === 0 && (
            <div className="flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-lg p-12">
              <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum método de pagamento configurado</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                Configure gateways de pagamento para permitir que seus usuários realizem pagamentos na plataforma.
              </p>
              <Button onClick={openCreateDialog}>
                Adicionar Primeiro Gateway
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo para adicionar/editar métodos de pagamento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Gateway de Pagamento' : 'Adicionar Gateway de Pagamento'}
            </DialogTitle>
            <DialogDescription>
              {editingId 
                ? 'Atualize as informações do gateway de pagamento.'
                : 'Configure um novo gateway para processar pagamentos na plataforma.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Gateway</Label>
              <Input
                id="name"
                placeholder="Ex: MercadoPago Brasil"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="gateway">Provedor</Label>
              <Select
                value={formData.gateway}
                onValueChange={(value: PaymentGateway['gateway']) => 
                  setFormData({...formData, gateway: value})
                }
              >
                <SelectTrigger id="gateway">
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mercadopago">MercadoPago</SelectItem>
                  <SelectItem value="pix">PIX Direto</SelectItem>
                  <SelectItem value="pagseguro">PagSeguro</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="apiKey">Chave API</Label>
              <Input
                id="apiKey"
                placeholder="Chave API fornecida pelo gateway"
                value={formData.apiKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, apiKey: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="apiSecret">Chave Secreta (opcional)</Label>
              <Input
                id="apiSecret"
                placeholder="Chave secreta fornecida pelo gateway"
                value={formData.apiSecret}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, apiSecret: e.target.value})}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="sandboxMode"
                checked={formData.sandboxMode}
                onCheckedChange={(checked: boolean) => setFormData({...formData, sandboxMode: checked})}
              />
              <Label htmlFor="sandboxMode">Modo Sandbox</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="isActive">Ativar gateway</Label>
            </div>
            
            {errorMessage && (
              <div className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errorMessage}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveGateway}
              disabled={!formData.name || !formData.gateway || !formData.apiKey}
            >
              {editingId ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 