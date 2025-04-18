'use client';

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UsersIcon, ShoppingBagIcon, TrophyIcon, GamepadIcon, BadgeIcon, WalletIcon, Settings2Icon } from 'lucide-react'

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

export default function AdminDashboard() {
  const router = useRouter()
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: "loading" | "authenticated" | "unauthenticated" }
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || !session.user) {
      router.push('/login')
      return
    }

    // Verificar se o usuário é admin
    if (session.user.isAdmin) {
      setIsAdmin(true)
    } else {
      router.push('/')
    }

    setIsLoading(false)
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

  const adminModules = [
    {
      title: 'Usuários',
      description: 'Gerenciar usuários e permissões',
      icon: <UsersIcon className="h-8 w-8 text-blue-500" />,
      path: '/admin/usuarios'
    },
    {
      title: 'Loja',
      description: 'Administrar itens da loja e ofertas',
      icon: <ShoppingBagIcon className="h-8 w-8 text-green-500" />,
      path: '/admin/loja'
    },
    {
      title: 'Torneios',
      description: 'Criar e gerenciar torneios',
      icon: <TrophyIcon className="h-8 w-8 text-yellow-500" />,
      path: '/admin/torneios'
    },
    {
      title: 'Salas de Jogo',
      description: 'Configurar salas oficiais para partidas',
      icon: <GamepadIcon className="h-8 w-8 text-purple-500" />,
      path: '/admin/salas'
    },
    {
      title: 'Insígnias',
      description: 'Gerenciar insígnias e banners',
      icon: <BadgeIcon className="h-8 w-8 text-orange-500" />,
      path: '/admin/insignias'
    },
    {
      title: 'Pagamentos',
      description: 'Configurar métodos de pagamento e processar transações',
      icon: <WalletIcon className="h-8 w-8 text-red-500" />,
      path: '/admin/pagamentos'
    },
    {
      title: 'Configurações',
      description: 'Configurações gerais do sistema',
      icon: <Settings2Icon className="h-8 w-8 text-gray-500" />,
      path: '/admin/configuracoes'
    }
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-gray-500">Bem-vindo ao painel de controle administrativo da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminModules.map((module, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center mb-2">
                {module.icon}
              </div>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => router.push(module.path)}
              >
                Acessar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 