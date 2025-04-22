import React from 'react';
import { Info, Check, Bell, AlertTriangle } from 'react-feather';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GenericNotificationProps {
  notification: {
    _id: string;
    type: string;
    title?: string;
    message?: string;
    read: boolean;
    createdAt: string | Date;
    data?: {
      title?: string;
      message?: string;
    };
  };
  onRead: () => void;
}

const GenericNotification: React.FC<GenericNotificationProps> = ({ notification, onRead }) => {
  // Extrair dados da notificação - lida com diferentes formatos de dados
  const title = notification.title || notification.data?.title || 'Notificação do sistema';
  const message = notification.message || notification.data?.message || '';
  const type = notification.type || 'system';
  const isRead = notification.read || false;

  // Formatação de data relativa
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
    addSuffix: true, 
    locale: ptBR 
  });

  // Escolher ícone com base no tipo de notificação
  const getIcon = () => {
    switch (type) {
      case 'system':
        return <Info size={20} className="text-blue-500" />;
      case 'alert':
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'success':
        return <Check size={20} className="text-green-500" />;
      default:
        return <Bell size={20} className="text-gray-400" />;
    }
  };

  // Handler para marcar como lida
  const handleMarkAsRead = () => {
    if (!isRead) {
      onRead();
    }
  };

  return (
    <div 
      className={`flex items-start gap-3 p-3 ${isRead ? 'bg-gray-800' : 'bg-gray-700'} 
                  border border-gray-700 rounded-lg shadow-sm mb-2 relative 
                  hover:bg-opacity-80 transition-colors cursor-pointer`}
      onClick={handleMarkAsRead}
    >
      {/* Indicador de não lida */}
      {!isRead && (
        <div className="absolute -top-1 -right-1 bg-blue-500 w-3 h-3 rounded-full"></div>
      )}
      
      <div className="flex-shrink-0 mt-1">
        {getIcon()}
      </div>
      
      <div className="space-y-1 flex-1">
        <div>
          <p className="font-medium text-sm text-white">
            {title}
          </p>
          <p className="text-sm text-gray-300">
            {message}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {timeAgo}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenericNotification; 