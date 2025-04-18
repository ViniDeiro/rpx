'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PushNotificationService } from '@/services/push/pushNotificationService';
import { toast } from 'react-toastify';
import { Bell, BellOff } from 'react-feather';
import axios from 'axios';

/**
 * Componente para gerenciar as notificações push
 * Este componente deve ser incluído no layout principal da aplicação
 */
const NotificationManager: React.FC = () => {
  const { data: session } = useSession();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Verificar se as notificações estão habilitadas
  useEffect(() => {
    // Verificar se o navegador suporta notificações
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Verificar permissão atual
      const permission = Notification.permission;
      setNotificationsEnabled(permission === 'granted');
    }
  }, []);

  // Inicializar serviço de notificações push
  useEffect(() => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      // Inicializar serviço
      PushNotificationService.initialize();
      
      // Configurar handlers para notificações push
      PushNotificationService.setupPushHandlers();
      
      // Verificar token e registrar
      registerDeviceToken();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Verificar a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [session]);

  // Função para registrar o token do dispositivo
  const registerDeviceToken = async () => {
    if (!session?.user?.id) return;
    
    try {
      // Obter token do dispositivo
      const token = await PushNotificationService.getToken();
      
      if (token) {
        // Salvar token no banco de dados
        const success = await PushNotificationService.saveToken(
          session.user.id,
          token
        );
        
        if (success) {
          console.log('Token registrado com sucesso');
          setNotificationsEnabled(true);
        }
      }
    } catch (error) {
      console.error('Erro ao registrar token do dispositivo:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/api/notifications/count');
      if (response.data.status === 'success') {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error);
    }
  };

  // Função para habilitar notificações
  const enableNotifications = async () => {
    if (!session?.user?.id) {
      toast.error('Você precisa estar logado para habilitar notificações');
      return;
    }
    
    setLoading(true);
    
    try {
      // Solicitar permissão
      const permission = await PushNotificationService.requestPermission();
      
      if (permission) {
        // Registrar token
        await registerDeviceToken();
        toast.success('Notificações habilitadas com sucesso');
      } else {
        toast.warn('Permissão para notificações negada. Verifique as configurações do seu navegador.');
      }
    } catch (error) {
      console.error('Erro ao habilitar notificações:', error);
      toast.error('Erro ao habilitar notificações');
    } finally {
      setLoading(false);
    }
  };

  // Componente para botão de notificações
  const NotificationButton = () => {
    // Se o navegador não suporta notificações, não mostrar botão
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return null;
    }

    const handleClick = () => {
      // Abrir o painel de notificações ou redirecionar para a página de notificações
      console.log('Abrir notificações');
    };

    return (
      <button
        onClick={handleClick}
        className="relative p-2 rounded-full hover:bg-card-hover transition-colors"
        aria-label="Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* 
        Este componente não renderiza nada visível por padrão,
        mas gerencia as notificações push em segundo plano.
        O botão NotificationButton pode ser exportado e usado em outros componentes.
      */}
      {/* <NotificationButton /> */}
    </>
  );
};

export default NotificationManager;

// Exportar botão para uso em outros componentes
export const NotificationButton: React.FC = () => {
  return <NotificationManager />;
}; 