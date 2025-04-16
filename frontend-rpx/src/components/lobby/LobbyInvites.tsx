import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';
import Image from 'next/image';
import axios from 'axios';
import { Check, X, LogIn } from 'react-feather';

interface LobbyInvitation {
  _id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  lobbyId: string;
  createdAt: string;
  expiresAt: string;
}

interface LobbyInvitesProps {
  onInviteAccepted?: (lobbyId: string) => void;
}

export default function LobbyInvites({ onInviteAccepted }: LobbyInvitesProps) {
  const { token } = useAuth();
  const router = useRouter();
  const [invitations, setInvitations] = useState<LobbyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingInvites, setProcessingInvites] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Buscar convites pendentes
    fetchInvitations();

    // Polling para buscar novos convites a cada 10 segundos
    const interval = setInterval(() => {
      fetchInvitations();
    }, 10000);

    return () => clearInterval(interval);
  }, [token]);

  const fetchInvitations = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/lobby/invite', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setInvitations(response.data.invitations || []);
    } catch (error) {
      console.error('Erro ao buscar convites para o lobby:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (invitationId: string, action: 'accept' | 'reject') => {
    if (!token) return;

    try {
      setProcessingInvites({ ...processingInvites, [invitationId]: 'processing' });

      const response = await axios.patch('/api/lobby/invite', 
        { invitationId, action },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setProcessingInvites({ ...processingInvites, [invitationId]: action });

      // Remover o convite da lista
      setInvitations(prev => prev.filter(inv => inv._id !== invitationId));

      if (action === 'accept') {
        toast.success('Convite aceito! Redirecionando para o lobby...');
        
        // Se onInviteAccepted for fornecido, chamá-lo
        if (onInviteAccepted) {
          onInviteAccepted(response.data.lobbyId);
        } else {
          // Caso contrário, redirecionar
          router.push(response.data.redirect);
        }
      } else {
        toast.info('Convite recusado.');
      }

    } catch (error) {
      console.error(`Erro ao ${action === 'accept' ? 'aceitar' : 'recusar'} convite:`, error);
      toast.error(`Erro ao ${action === 'accept' ? 'aceitar' : 'recusar'} convite.`);
      setProcessingInvites({ ...processingInvites, [invitationId]: 'error' });
    }
  };

  const formatTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const timeDiff = expires.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Expirado';
    
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  if (loading && invitations.length === 0) {
    return null; // Não mostrar nada durante o carregamento inicial
  }

  if (invitations.length === 0) {
    return null; // Não mostrar nada se não houver convites
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-80 max-w-full">
      {invitations.map(invitation => (
        <div 
          key={invitation._id}
          className="bg-card-bg border border-primary/20 rounded-lg shadow-lg p-4 mb-2 animate-slideIn backdrop-blur-sm"
        >
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-primary/10 flex-shrink-0">
              <Image 
                src={invitation.senderAvatar} 
                alt={invitation.senderUsername}
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <div>
              <h4 className="font-medium text-white">{invitation.senderUsername}</h4>
              <p className="text-xs text-primary-light/80">
                Convite para lobby • Expira em {formatTimeLeft(invitation.expiresAt)}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            {processingInvites[invitation._id] === 'processing' ? (
              <div className="w-full py-2 text-center">
                <div className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : processingInvites[invitation._id] ? (
              <div className="w-full py-2 text-center text-sm">
                {processingInvites[invitation._id] === 'accept' ? 
                  'Redirecionando...' : 'Convite recusado'}
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleInvite(invitation._id, 'accept')}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white rounded py-2 px-4 text-sm flex items-center justify-center transition-colors"
                >
                  <LogIn size={14} className="mr-1" />
                  Entrar
                </button>
                <button
                  onClick={() => handleInvite(invitation._id, 'reject')}
                  className="flex-1 bg-card-hover hover:bg-gray-700 rounded py-2 px-4 text-sm flex items-center justify-center transition-colors"
                >
                  <X size={14} className="mr-1" />
                  Recusar
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 