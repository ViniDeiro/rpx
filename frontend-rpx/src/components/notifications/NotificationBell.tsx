import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'react-feather';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import NotificationCenter from './NotificationCenter';
import { toast } from 'react-toastify';
import { PushNotificationService } from '@/services/push/pushNotificationService';

// Definir uma interface para notificações
interface Notification {
  _id: string;
  type: string;
  read: boolean;
  createdAt: string;
  [key: string]: any; // Para campos adicionais específicos de cada tipo
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const { data: session } = useSession();
  
  // Função principal para buscar notificações
  const fetchNotifications = async () => {
    if (!session?.user || isLoading) return;
    
    try {
      setIsLoading(true);
      console.log('🔎 NotificationBell: Buscando notificações...');
      
      // Obter token para autenticação
      const token = localStorage.getItem('auth_token') || 
                     (session as any)?.accessToken || 
                     localStorage.getItem('token');
      
      // Definir cabeçalhos com token de autenticação
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Buscar as notificações da API unificada com token
      const response = await axios.get('/api/notifications', { 
        headers,
        // Adicionar timeout para evitar espera indefinida
        timeout: 5000
      });
      
      if (response.data.success) {
        const { notifications, unreadCount } = response.data.data;
        
        console.log(`✅ NotificationBell: API retornou ${notifications.length} notificações, ${unreadCount} não lidas`);
        
        // Log detalhado quando há notificações (para debug)
        if (notifications && notifications.length > 0) {
          console.log('📋 NotificationBell: Lista de notificações:');
          notifications.forEach((notif: Notification, index: number) => {
            if (notif.type === 'lobby_invite') {
              const inviterName = notif.inviterName || 
                                 (notif.data?.inviter?.username) || 
                                 'Desconhecido';
              const inviteId = notif.data?.invite?._id || notif._id || notif.id;
              const lobbyId = notif.lobbyId || notif.data?.invite?.lobbyId || notif.data?.lobbyId || 'Desconhecido';
              console.log(`  📨 #${index+1}: Convite de ${inviterName} | ID: ${inviteId?.substring(0,8)}... | Lobby: ${typeof lobbyId === 'string' ? lobbyId.substring(0,8) : 'N/A'}...`);
            } else {
              console.log(`  📨 #${index+1}: Tipo: ${notif.type} | ID: ${(notif._id || notif.id)?.substring(0,8)}...`);
            }
          });
        } else {
          console.log('⚠️ NotificationBell: Nenhuma notificação encontrada');
        }
        
        // Garantir que todas as notificações tenham os campos necessários
        const validNotifications = notifications.filter((n: any) => n && (n._id || n.id));
        
        // Atualizar o estado
        setNotifications(validNotifications);
        setUnreadCount(unreadCount);
        
        // Limpar erros de autenticação se houver
        setAuthError(false);
      } else {
        console.error('❌ NotificationBell: Erro na resposta da API:', response.data);
      }
    } catch (error) {
      console.error('❌ NotificationBell: Erro ao buscar notificações:', error);
      
      // Verificar se é erro de autenticação
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log('🔒 NotificationBell: Erro de autenticação detectado');
        setAuthError(true);
      }
      
      // Não fazer nada em caso de erro - apenas logar
      // Para evitar UI quebrada, mantemos o estado anterior
    } finally {
      setIsLoading(false);
    }
  };
  
  // Efeito para buscar notificações quando o usuário estiver autenticado
  useEffect(() => {
    if (session?.user) {
      console.log('🔄 NotificationBell: Iniciando componente com usuário logado:', session.user.name);
      
      // Buscar imediatamente na inicialização 
      fetchNotifications();
      
      // Configurar polling para atualizar as notificações a cada 5 segundos
      // Aumentado de 3 para 5 segundos para reduzir sobrecarga
      const interval = setInterval(() => {
        console.log('🔄 NotificationBell: Verificação periódica de notificações');
        fetchNotifications();
      }, 5000);
      
      // Forçar outra busca após 2 segundos para garantir que dados são carregados
      // Aumentado de 1 para 2 segundos para dar mais tempo ao servidor
      setTimeout(() => {
        console.log('🔄 NotificationBell: Verificação secundária de notificações');
        fetchNotifications();
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [session]);
  
  // Verificar se as notificações push estão habilitadas
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);
  
  // Abrir/fechar o painel de notificações
  const toggleNotificationCenter = () => {
    setIsOpen(!isOpen);
    // Se estiver abrindo, buscar as notificações mais recentes
    if (!isOpen) {
      console.log('🔄 NotificationBell: Abrindo painel de notificações - Buscando atualizações');
      fetchNotifications();
    }
  };

  // Função para habilitar notificações push
  const enablePushNotifications = async () => {
    if (!session?.user?.id) {
      toast.error('Você precisa estar logado para habilitar notificações');
      return;
    }
    
    setPushLoading(true);
    
    try {
      // Inicializar serviço se necessário
      PushNotificationService.initialize();
      
      // Solicitar permissão
      const permission = await PushNotificationService.requestPermission();
      
      if (permission) {
        // Obter token
        const token = await PushNotificationService.getToken();
        
        if (token) {
          // Salvar token
          const success = await PushNotificationService.saveToken(
            session.user.id,
            token
          );
          
          if (success) {
            setPushEnabled(true);
            toast.success('Notificações push habilitadas com sucesso');
          }
        }
      } else {
        toast.warn('Permissão para notificações negada. Verifique as configurações do seu navegador.');
      }
    } catch (error) {
      console.error('Erro ao habilitar notificações push:', error);
      toast.error('Erro ao habilitar notificações push');
    } finally {
      setPushLoading(false);
    }
  };
  
  // Função para forçar sincronização de autenticação
  const handleAuthRetry = async () => {
    try {
      toast.info('Sincronizando autenticação...');
      const token = localStorage.getItem('auth_token');
      
      if (!token && !session?.user?.id) {
        toast.error('Informações de autenticação não encontradas. Faça login novamente.');
        return;
      }
      
      // Usar a nova API de force-auth
      const response = await fetch('/api/auth/force-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          userId: session?.user?.id,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Atualizar o token no localStorage
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        toast.success('Autenticação sincronizada com sucesso!');
        setAuthError(false);
        
        // Recarregar a página para aplicar as mudanças
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast.error(`Falha ao sincronizar: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao tentar sincronizar autenticação:', error);
      toast.error('Erro ao tentar sincronizar. Tente fazer login novamente.');
    }
  };
  
  // Adiciona atributo de teste para facilitar depuração
  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {/* Botão para habilitar notificações push */}
        {session?.user && !pushEnabled && typeof window !== 'undefined' && 'Notification' in window && (
          <button
            onClick={enablePushNotifications}
            disabled={pushLoading}
            className="bg-gray-800 hover:bg-gray-700 text-white rounded-full px-3 py-2 text-sm shadow-lg flex items-center justify-center relative"
            aria-label="Ativar notificações push"
          >
            {pushLoading ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            ) : (
              <BellOff size={16} className="mr-2" />
            )}
            <span>Ativar notificações</span>
          </button>
        )}
        
        {/* Botão para reautenticar quando houver erro 401 */}
        {authError && (
          <button
            onClick={handleAuthRetry}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full px-3 py-2 text-sm shadow-lg flex items-center justify-center relative"
            aria-label="Sincronizar autenticação"
          >
            <span className="mr-2">🔄</span>
            <span>Sincronizar conta</span>
          </button>
        )}
        
        {/* Botão de notificações */}
        <button
          onClick={toggleNotificationCenter}
          className="bg-primary hover:bg-primary-dark text-white rounded-full p-3 shadow-lg flex items-center justify-center relative"
          aria-label="Notificações"
          data-testid="notification-bell"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      
      <NotificationCenter 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        onUpdate={fetchNotifications}
      />
    </>
  );
} 