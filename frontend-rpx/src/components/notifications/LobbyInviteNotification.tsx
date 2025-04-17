import React, { useState } from 'react';
import Link from 'next/link';
import { AvatarImage, Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { rejectLobbyInvite, acceptLobbyInvite } from '@/lib/api/lobby';

interface NotificationProps {
  notification: any;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onDismiss?: (id: string) => void;
}

export default function LobbyInviteNotification({ 
  notification, 
  onAccept, 
  onReject,
  onDismiss
}: NotificationProps) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  // Debug: mostrar a estrutura da notificação
  console.log('Recebida notificação de convite:', notification);

  // Função para extrair os dados necessários do objeto de notificação
  const extractNotificationData = () => {
    try {
      // Verificar primeiro se a notificação está no formato direto (da API de notificações)
      if (notification.type === 'lobby_invite') {
        console.log('Notificação no formato direto');
        return {
          id: notification._id || '',
          inviterId: notification.inviter || '',
          inviterName: notification.inviterName || 'Usuário',
          inviterAvatar: notification.inviterAvatar || '/images/avatars/default.png',
          lobbyId: notification.lobbyId || '',
          lobbyName: notification.lobbyName || 'Lobby',
          createdAt: notification.createdAt || new Date(),
          gameMode: notification.gameMode || 'casual'
        };
      }
      
      // Formato aninhado (da API de convites)
      console.log('Tentando extrair do formato aninhado');
      
      // Verificar se existe data.invite
      if (notification.data && notification.data.invite) {
        const invite = notification.data.invite;
        const inviter = notification.data.inviter || {};
        
        return {
          id: invite._id || '',
          inviterId: inviter._id || '',
          inviterName: inviter.username || 'Usuário',
          inviterAvatar: inviter.avatar || '/images/avatars/default.png',
          lobbyId: invite.lobbyId || '',
          lobbyName: 'Lobby', // Não temos esse dado no formato aninhado
          createdAt: invite.createdAt || notification.createdAt || new Date(),
          gameMode: invite.gameMode || 'casual'
        };
      }
      
      // Throw error para cair no fallback
      throw new Error('Formato de notificação desconhecido');
    } catch (error) {
      console.error('Erro ao extrair dados da notificação:', error);
      console.error('Estrutura da notificação:', notification);
      
      // Dados de fallback
      return {
        id: notification._id || notification.id || '',
        inviterId: '',
        inviterName: 'Usuário',
        inviterAvatar: '/images/avatars/default.png',
        lobbyId: '',
        lobbyName: 'Lobby',
        createdAt: new Date(),
        gameMode: 'casual'
      };
    }
  };

  const { 
    id, 
    inviterId, 
    inviterName, 
    inviterAvatar, 
    lobbyId, 
    lobbyName, 
    createdAt, 
    gameMode 
  } = extractNotificationData();

  // Formatação de data relativa
  const timeAgo = createdAt 
    ? formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ptBR }) 
    : 'recentemente';

  // Handler para aceitar convite
  const handleAccept = async () => {
    if (!id) {
      toast.error('ID do convite não encontrado');
      return;
    }
    
    try {
      setLoading('accept');
      const response = await acceptLobbyInvite(id);
      
      if (response.success) {
        toast.success('Convite aceito com sucesso!');
        if (onAccept) onAccept(id);
      } else {
        toast.error(response.message || 'Não foi possível aceitar o convite');
      }
    } catch (error) {
      console.error('Erro ao aceitar convite:', error);
      toast.error('Ocorreu um erro ao aceitar o convite');
    } finally {
      setLoading(null);
    }
  };

  // Handler para rejeitar convite
  const handleReject = async () => {
    if (!id) {
      toast.error('ID do convite não encontrado');
      return;
    }
    
    try {
      setLoading('reject');
      const response = await rejectLobbyInvite(id);
      
      if (response.success) {
        toast.success('Convite rejeitado');
        if (onReject) onReject(id);
      } else {
        toast.error(response.message || 'Não foi possível rejeitar o convite');
      }
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
      toast.error('Ocorreu um erro ao rejeitar o convite');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg shadow-sm">
      <div className="flex-shrink-0">
        <Avatar>
          <AvatarImage src={inviterAvatar} alt={inviterName} />
          <AvatarFallback>{inviterName[0]}</AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-medium text-sm text-primary">
                <span className="font-bold">{inviterName}</span> te convidou para um lobby
              </p>
              <p className="text-xs text-muted-foreground">
                {lobbyName} • Modo {gameMode === 'ranked' ? 'Ranqueado' : 'Casual'} • {timeAgo}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleAccept}
              disabled={loading !== null}
              className="min-w-20"
            >
              {loading === 'accept' ? 'Aceitando...' : 'Aceitar'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={loading !== null}
              className="min-w-20"
            >
              {loading === 'reject' ? 'Rejeitando...' : 'Rejeitar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 