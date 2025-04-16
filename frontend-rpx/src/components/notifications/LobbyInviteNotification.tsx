import React, { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { Notification } from '@/types/notification';
import axios from 'axios';

interface LobbyInviteNotificationProps {
  notification?: Notification;
  invite?: any;
  onClose?: () => void;
  refetch?: () => void;
  onAccept?: (lobbyId: string) => Promise<void>;
  onReject?: (inviteId: string) => Promise<void>;
}

const LobbyInviteNotification: React.FC<LobbyInviteNotificationProps> = ({ 
  notification, 
  invite,
  onClose,
  refetch,
  onAccept,
  onReject
}) => {
  const router = useRouter();
  const { data: session } = useSession();

  // Log ao montar para debugging
  useEffect(() => {
    console.log('LobbyInviteNotification renderizado com dados:', { 
      notification: notification ? notification._id : 'undefined', 
      invite: invite ? invite._id : 'undefined' 
    });
    
    if (notification?.data) {
      console.log('Dados da notificação:', JSON.stringify(notification.data, null, 2));
    }
  }, [notification, invite]);
  
  // Determinar se estamos usando o modo de notificação ou o modo de convite direto
  const isNotificationMode = !!notification;
  
  // Validação dos dados
  if (isNotificationMode && (!notification.data || !notification.data.inviter || !notification.data.invite)) {
    console.error('Notificação com dados incompletos:', notification);
    return (
      <div className="bg-slate-800 rounded-lg p-4 shadow-lg mb-2">
        <p className="text-white">Convite inválido ou incompleto</p>
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 text-sm rounded mt-2"
        >
          Fechar
        </button>
      </div>
    );
  }

  // Extrair dados dependendo do modo
  const inviter = isNotificationMode && notification?.data?.inviter ? notification.data.inviter : invite?.inviter;
  const inviteData = isNotificationMode && notification?.data?.invite ? notification.data.invite : invite;
  const inviteId = isNotificationMode && notification?.data?.invite?._id ? notification.data.invite._id : invite?._id;
  const lobbyId = isNotificationMode && notification?.data?.invite?.lobbyId ? notification.data.invite.lobbyId : invite?.lobbyId;
  
  // Verificar se temos os dados mínimos necessários
  if (!inviteId || !lobbyId) {
    console.error('Convite com dados essenciais faltando:', { inviteId, lobbyId });
    return (
      <div className="bg-slate-800 rounded-lg p-4 shadow-lg mb-2">
        <p className="text-white">Convite com dados incompletos</p>
        <button
          onClick={onClose}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 text-sm rounded mt-2"
        >
          Fechar
        </button>
      </div>
    );
  }
  
  const handleAcceptInvite = async () => {
    console.log('Tentando aceitar convite:', inviteId, 'para lobby:', lobbyId);
    
    if (onAccept) {
      await onAccept(lobbyId);
      return;
    }
    
    try {
      const response = await axios.post('/api/lobby/invite/accept', {
        inviteId: inviteId,
      });
      
      console.log('Resposta ao aceitar convite:', response.data);
      
      if (response.data.status === 'success') {
        toast.success('Convite aceito! Redirecionando para o lobby...');
        onClose?.();
        refetch?.();
        router.push(`/lobby/${response.data.lobbyId}`);
      } else {
        toast.error(response.data.error || 'Erro ao aceitar convite');
      }
    } catch (error: any) {
      console.error('Erro ao aceitar convite:', error);
      toast.error(error.response?.data?.error || 'Falha ao aceitar convite');
    }
  };
  
  const handleRejectInvite = async () => {
    console.log('Tentando rejeitar convite:', inviteId);
    
    if (onReject) {
      await onReject(inviteId);
      return;
    }
    
    try {
      const response = await axios.post('/api/lobby/invite/reject', {
        inviteId: inviteId,
      });
      
      console.log('Resposta ao rejeitar convite:', response.data);
      
      if (response.data.status === 'success') {
        toast.success('Convite recusado');
        onClose?.();
        refetch?.();
      } else {
        toast.error(response.data.error || 'Erro ao recusar convite');
      }
    } catch (error: any) {
      console.error('Erro ao recusar convite:', error);
      toast.error(error.response?.data?.error || 'Falha ao recusar convite');
    }
  };

  const inviterAvatar = inviter?.avatar || '/images/avatars/default.png';
  const inviterName = inviter?.username || 'Usuário';

  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg mb-2">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          <Image
            src={inviterAvatar}
            alt={inviterName}
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
        <div className="flex-1">
          <p className="text-white">
            <span className="font-semibold">{inviterName}</span> convidou você para um lobby!
          </p>
          <div className="mt-2 flex space-x-2">
            <button
              onClick={handleAcceptInvite}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm rounded"
            >
              Aceitar
            </button>
            <button
              onClick={handleRejectInvite}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm rounded"
            >
              Recusar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LobbyInviteNotification; 