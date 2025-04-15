'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, UserPlus, Users } from 'react-feather';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'react-toastify';

// Interfaces
interface FriendRequest {
  id: string;
  sender: {
    id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
}

interface Friend {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-game';
}

export default function FriendRequestsPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // Redirecionar se o usuário não estiver autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Carregar solicitações de amizade
  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) return;
      
      try {
        setIsLoadingRequests(true);
        const response = await axios.get('/api/users/friends/requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setFriendRequests(response.data.requests || []);
      } catch (error) {
        console.error('Erro ao carregar solicitações de amizade:', error);
        toast.error('Não foi possível carregar as solicitações de amizade.');
      } finally {
        setIsLoadingRequests(false);
      }
    };
    
    fetchRequests();
  }, [token]);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/users/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Erro ao buscar amigos:', error);
    }
  };

  // Aceitar solicitação
  const handleAcceptFriendRequest = async (requestId: string) => {
    if (!token) return;
    
    try {
      await axios.patch(`/api/users/friends/requests/${requestId}`, 
        { action: 'accept' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Remover a solicitação da lista
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast.success('Solicitação de amizade aceita com sucesso!');
    } catch (error) {
      console.error('Erro ao aceitar solicitação:', error);
      toast.error('Não foi possível aceitar a solicitação.');
    }
  };

  // Recusar solicitação
  const handleRejectFriendRequest = async (requestId: string) => {
    if (!token) return;
    
    try {
      await axios.patch(`/api/users/friends/requests/${requestId}`, 
        { action: 'reject' },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Remover a solicitação da lista
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast.success('Solicitação de amizade rejeitada.');
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast.error('Não foi possível rejeitar a solicitação.');
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Mostrar tela de carregamento enquanto verifica autenticação
  if (isLoading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Solicitações de Amizade</h1>
      
      {isLoadingRequests ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : friendRequests.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Você não tem solicitações de amizade pendentes.
          </p>
          <Link href="/friends" className="mt-4 inline-block text-blue-600 hover:underline">
            Ver meus amigos
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {friendRequests.map(request => (
            <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center mb-4">
                <Image 
                  src={request.sender.avatar} 
                  alt={request.sender.username}
                  width={48} 
                  height={48} 
                  className="rounded-full"
                />
                <div className="ml-3">
                  <h3 className="font-medium">{request.sender.username}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Solicitado em: {formatDate(request.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAcceptFriendRequest(request.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                >
                  Aceitar
                </button>
                <button
                  onClick={() => handleRejectFriendRequest(request.id)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                >
                  Recusar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8">
        <Link href="/profile" className="text-blue-600 hover:underline">
          Voltar para o perfil
        </Link>
      </div>
    </div>
  );
} 