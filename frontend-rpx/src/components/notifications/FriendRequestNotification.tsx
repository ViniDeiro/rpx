import React, { useEffect } from 'react';
import Image from 'next/image';
import { Check, X } from 'react-feather';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FriendRequestNotificationProps {
  request: {
    _id: string;
    id?: string;
    sender?: {
      _id?: string;
      id?: string;
      username?: string;
      avatarUrl?: string;
      name?: string;
    };
    createdAt: string;
    senderUsername?: string;
    senderName?: string;
    senderAvatarUrl?: string;
    senderId?: string;
    // Suporte para formato aninhado em 'data'
    data?: {
      sender?: {
        _id?: string;
        id?: string;
        username?: string;
        avatarUrl?: string; 
        name?: string;
      };
      senderUsername?: string;
      senderName?: string;
      senderAvatarUrl?: string;
      senderId?: string;
    };
  };
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const FriendRequestNotification: React.FC<FriendRequestNotificationProps> = ({ 
  request, 
  onAccept, 
  onReject 
}) => {
  // Debug: mostrar a estrutura da solicitação
  useEffect(() => {
    console.log('Detalhes da solicitação de amizade:', JSON.stringify(request, null, 2));
  }, [request]);
  
  // Extrair dados seguros da solicitação
  const requestId = request._id || request.id || '';
  
  // Tentar obter informações do remetente de múltiplas fontes possíveis
  const sender = request.sender || request.data?.sender || {};
  const username = sender.username || 
                  sender.name || 
                  request.senderUsername || 
                  request.senderName || 
                  request.data?.senderUsername || 
                  request.data?.senderName || 
                  'Usuário';
  
  const avatarUrl = sender.avatarUrl || 
                   request.senderAvatarUrl || 
                   request.data?.senderAvatarUrl || 
                   '/images/avatars/default.jpg';
  
  const handleAccept = () => {
    onAccept(requestId);
  };

  const handleReject = () => {
    onReject(requestId);
  };

  // Formatação da data
  const formattedDate = new Date(request.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="p-4 border-b border-gray-800 flex items-center">
      <div className="w-12 h-12 mr-4 relative flex-shrink-0">
        <Avatar>
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback>{username ? username[0].toUpperCase() : 'U'}</AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1">
        <p className="text-white font-medium">
          {username}
        </p>
        <p className="text-gray-400 text-sm">
          Enviou uma solicitação de amizade
        </p>
        <p className="text-gray-500 text-xs">
          {formattedDate}
        </p>
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={handleAccept}
          className="p-2 bg-green-600 rounded-full hover:bg-green-700 transition"
          aria-label="Aceitar solicitação"
        >
          <Check size={16} className="text-white" />
        </button>
        <button 
          onClick={handleReject}
          className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition"
          aria-label="Rejeitar solicitação"
        >
          <X size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default FriendRequestNotification; 