import React, { useState, useEffect, useRef } from 'react';
import { X, Info, Check, AlertCircle, Clock } from 'react-feather';
import { useSocket } from '../hooks/useSocket';
import { useRouter } from 'next/router';

/**
 * Componente de Toast para Notificações
 * Exibe notificações em tempo real como toasts
 */
const NotificationToast = () => {
  const socket = useSocket();
  const router = useRouter();
  const [toasts, setToasts] = useState([]);
  const toastTimeoutsRef = useRef({});

  useEffect(() => {
    if (!socket) return;

    // Ouvir eventos de notificações em tempo real
    socket.on('notification', handleNewNotification);
    socket.on('systemNotification', handleNewNotification);

    return () => {
      socket.off('notification');
      socket.off('systemNotification');

      // Limpar todos os timeouts na desmontagem
      Object.values(toastTimeoutsRef.current).forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    };
  }, [socket]);

  // Manipular nova notificação
  const handleNewNotification = (notification) => {
    // Gerar um ID único se não tiver
    const toastId = notification._id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Adicionar toast à lista
    setToasts(prevToasts => [
      ...prevToasts, 
      { ...notification, id: toastId }
    ]);
    
    // Configurar remoção automática após 5 segundos
    toastTimeoutsRef.current[toastId] = setTimeout(() => {
      removeToast(toastId);
    }, 5000);
  };

  // Remover toast da lista
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    
    // Limpar timeout
    if (toastTimeoutsRef.current[id]) {
      clearTimeout(toastTimeoutsRef.current[id]);
      delete toastTimeoutsRef.current[id];
    }
  };

  // Acessar a ação da notificação (se existir)
  const handleAction = (toast) => {
    if (toast.action && toast.action.type === 'navigate' && toast.action.target) {
      router.push(toast.action.target);
    }
    removeToast(toast.id);
  };

  // Obter ícone com base no tipo de notificação
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'welcome':
      case 'system_announcement':
        return <Info className="text-blue-500" size={20} />;
      case 'match_invitation':
      case 'match_reminder':
        return <Clock className="text-purple-500" size={20} />;
      case 'transaction_completed':
      case 'deposit_received':
      case 'withdrawal_processed':
        return <Check className="text-green-500" size={20} />;
      case 'match_dispute':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <Info className="text-gray-500" size={20} />;
    }
  };

  // Obter cor de fundo com base na prioridade
  const getBackgroundColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'normal':
        return 'bg-blue-50 border-blue-200';
      case 'low':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col-reverse gap-3 max-w-md">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`p-4 rounded-md shadow-md border ${getBackgroundColor(toast.priority)} flex items-start transition-all duration-300 transform translate-x-0`}
          role="alert"
        >
          <div className="mr-3 flex-shrink-0 mt-1">
            {getNotificationIcon(toast.type)}
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{toast.title}</h4>
            <p className="text-sm text-gray-700">{toast.message}</p>
            
            {toast.action && toast.action.type === 'navigate' && (
              <button 
                className="mt-2 text-sm text-blue-600 hover:underline"
                onClick={() => handleAction(toast)}
              >
                Ver detalhes
              </button>
            )}
          </div>
          
          <button 
            className="ml-4 text-gray-400 hover:text-gray-600"
            onClick={() => removeToast(toast.id)}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast; 