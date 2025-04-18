import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PushNotificationService } from '@/services/push/pushNotificationService';
import { toast } from 'react-toastify';
import { Bell, BellOff } from 'react-feather';

/**
 * Componente para gerenciar as notificações push
 * Este componente deve ser incluído no layout principal da aplicação
 */
const NotificationManager: React.FC = () => {
  const { data: session } = useSession();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

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

    return (
      <button
        onClick={enableNotifications}
        disabled={notificationsEnabled || loading}
        className={`
          flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium
          ${notificationsEnabled 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200'}
          transition-colors duration-200
        `}
        title={notificationsEnabled ? 'Notificações ativadas' : 'Ativar notificações'}
      >
        {loading ? (
          <span className="h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
        ) : notificationsEnabled ? (
          <Bell size={16} />
        ) : (
          <BellOff size={16} />
        )}
        <span>{notificationsEnabled ? 'Ativadas' : 'Ativar notificações'}</span>
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