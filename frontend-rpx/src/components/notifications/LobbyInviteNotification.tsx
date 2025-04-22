import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ObjectId } from 'mongodb';

interface LobbyInvite {
  _id?: string | ObjectId;
  id?: string;
  type: string;
  read: boolean;
  status?: string;
  createdAt: string | Date;
  inviterId?: string;
  inviterName?: string;
  inviterAvatar?: string;
  lobbyId?: string | ObjectId;
  lobbyName?: string;
  gameMode?: string;
  // Suporte para diversos formatos de dados
  userId?: string;
  data?: {
    inviteId?: string;
    lobbyId?: string;
    inviterId?: string;
    inviterName?: string;
    status?: string;
    gameMode?: string;
    inviterAvatar?: string;
    invite?: {
      _id?: string;
      lobbyId?: string;
      status?: string;
      createdAt?: string | Date;
      gameMode?: string;
    };
    inviter?: {
      _id?: string;
      username?: string;
      avatar?: string;
    };
  };
}

interface NotificationProps {
  invite: LobbyInvite;
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
  const router = useRouter();

  // Debug: mostrar a estrutura da notificação
  useEffect(() => {
    console.log('Detalhes do convite de lobby:', JSON.stringify(invite, null, 2));
  }, [invite]);

  // Garantir que temos um ID válido para o convite
  const id = invite.id || invite._id?.toString() || invite.data?.inviteId || '';
  
  // Formato do nome do convidador (tentar diferentes caminhos)
  const inviterName = invite.inviterName || 
                      invite.data?.inviterName ||
                      invite.data?.inviter?.username || 
                      'Sistema';
  
  // Formato do avatar (tentar diferentes caminhos)
  const inviterAvatar = invite.inviterAvatar || 
                        invite.data?.inviterAvatar ||
                        invite.data?.inviter?.avatar || 
                        '/images/avatars/default.png';
  
  // Obter ID do lobby (tentar diferentes caminhos)
  const lobbyId = invite.lobbyId?.toString() || 
                 invite.data?.lobbyId?.toString() ||
                 invite.data?.invite?.lobbyId?.toString() || 
                 '123456789'; // ID padrão para evitar erros
  
  // Obter nome do lobby
  const lobbyName = invite.lobbyName || 'Lobby de ' + inviterName;
  
  // Obter modo de jogo
  const gameMode = invite.gameMode || 
                  invite.data?.gameMode ||
                  invite.data?.invite?.gameMode || 
                  'casual';
  
  // Obter data de criação
  const createdAt = invite.createdAt || 
                   invite.data?.invite?.createdAt || 
                   new Date();
  
  // Obter status
  const status = invite.status || 
                invite.data?.status ||
                invite.data?.invite?.status || 
                'pending';

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
      console.log('Aceitando convite de lobby:', id);
      setLoading('accept');
      
      // Chamar a API para aceitar o convite
      const response = await fetch('/api/lobby/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId: id }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Convite aceito com sucesso!');
        
        // Verificar se o lobbyId está disponível na resposta
        if (data.lobbyId) {
          console.log('Redirecionando para o lobby:', data.lobbyId);
          
          // Método simplificado - redirecionar diretamente sem verificações
          toast.success('Redirecionando para o lobby...');
          
          // Redirecionamento direto para a página de lobby
          setTimeout(() => {
            // Usar replace para evitar problemas de histórico de navegação
            window.location.href = `/lobby/${data.lobbyId}`;
          }, 500);
        } else {
          console.error('ID do lobby não recebido na resposta:', data);
          toast.error('Erro ao obter ID do lobby');
          
          // Tentar usar o ID do lobby do convite como fallback
          if (lobbyId) {
            console.log('Usando ID do lobby do convite como fallback:', lobbyId);
            setTimeout(() => {
              window.location.href = `/lobby/${lobbyId}`;
            }, 500);
          }
        }
        
        // Chamar a função de callback para atualizar a lista de notificações
        await onAccept(id);
      } else {
        console.error('Erro na resposta ao aceitar convite:', data);
        toast.error(data.error || 'Ocorreu um erro ao aceitar o convite');
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
      console.log('Rejeitando convite de lobby:', id);
      setLoading('reject');
      await onReject(id);
    } catch (error) {
      console.error('Erro ao rejeitar convite:', error);
      toast.error('Ocorreu um erro ao rejeitar o convite');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg shadow-sm mb-2 relative hover:bg-opacity-80 transition-colors">
      {/* Badge para indicar o tipo de notificação */}
      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
        Convite
      </div>
      
      <div className="flex-shrink-0">
        <Avatar>
          <AvatarImage src={inviterAvatar} alt={inviterName} />
          <AvatarFallback>{inviterName ? inviterName[0] : 'U'}</AvatarFallback>
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
        
        {/* ID do convite para Debug */}
        {id && (
          <div className="text-xs text-gray-500 mt-1">
            ID: {id.substring(0, 8)}...
          </div>
        )}
      </div>
    </div>
  );
} 