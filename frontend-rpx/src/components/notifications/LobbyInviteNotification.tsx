import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface NotificationProps {
  invite: any;
  onAccept: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onDismiss: () => Promise<void>;
}

export default function LobbyInviteNotification({ 
  invite, 
  onAccept, 
  onReject,
  onDismiss
}: NotificationProps) {
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null);

  // Debug: mostrar a estrutura da notificação
  console.log('Renderizando notificação de convite:', invite);

  // Extrair dados da notificação
  const id = invite._id?.toString();
  const inviterName = invite.inviterName || 'Usuário';
  const inviterAvatar = invite.inviterAvatar || '/images/avatars/default.png';
  const lobbyName = invite.lobbyName || 'Lobby';
  const gameMode = invite.gameMode || 'casual';
  const createdAt = invite.createdAt || new Date();

  // Formatação de data relativa
  const timeAgo = formatDistanceToNow(new Date(createdAt), { 
    addSuffix: true, 
    locale: ptBR 
  });

  // Handler para aceitar convite
  const handleAccept = async () => {
    if (!id) {
      toast.error('ID do convite não encontrado');
      return;
    }
    
    try {
      setLoading('accept');
      await onAccept(id);
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
      await onReject(id);
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
      toast.error('Ocorreu um erro ao rejeitar o convite');
    } finally {
      setLoading(null);
    }
  };

  if (!id) {
    console.error('Convite sem ID válido:', invite);
    return null;
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg shadow-sm mb-2">
      <div className="flex-shrink-0">
        <Avatar>
          <AvatarImage src={inviterAvatar} alt={inviterName} />
          <AvatarFallback>{inviterName[0]}</AvatarFallback>
        </Avatar>
      </div>
      
      <div className="space-y-1 flex-1">
        <div>
          <p className="font-medium text-sm text-primary">
            <span className="font-bold">{inviterName}</span> te convidou para um lobby
          </p>
          <p className="text-xs text-muted-foreground">
            {lobbyName} • Modo {gameMode === 'ranked' ? 'Ranqueado' : 'Casual'} • {timeAgo}
          </p>
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
  );
} 