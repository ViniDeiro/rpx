'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Trash, Plus, RefreshCcw, Users, User } from 'lucide-react';

// Definir interface para o objeto de resultado
interface ResultState {
  success: boolean;
  message: string;
}

export default function DebugNotifications() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [notificationType, setNotificationType] = useState('system');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [forceDev, setForceDev] = useState(false);

  useEffect(() => {
    console.log('Auth status:', status);
    console.log('Session data:', session);
    
    // Salva informações de autenticação para debug
    setAuthInfo({
      status,
      user: session?.user,
      timestamp: new Date().toISOString()
    });
    
    // Tentar buscar notificações independente do status
    fetchNotifications();
  }, [status, session, forceDev]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Log da tentativa
      console.log('Tentando buscar notificações...');
      
      const res = await fetch('/api/debug/notifications?action=fetch');
      
      console.log('Resposta da API:', res.status, res.statusText);
      
      const data = await res.json();
      console.log('Dados recebidos:', data);
      
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setResult({
          success: true,
          message: `Carregadas ${data.data.count} notificações`
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async () => {
    try {
      setLoading(true);
      
      const title = notificationTitle || 'Notificação de teste';
      const message = notificationMessage || 'Esta é uma notificação de teste gerada pela página de depuração.';
      
      const res = await fetch(
        `/api/debug/notifications?action=create&type=${notificationType}&title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}`
      );
      
      const data = await res.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: 'Notificação criada com sucesso'
        });
        
        // Atualizar a lista de notificações
        await fetchNotifications();
      } else {
        setResult({
          success: false,
          message: data.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/debug/notifications?action=clear');
      const data = await res.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: `Removidas ${data.data.deleted} notificações`
        });
        
        // Atualizar a lista
        await fetchNotifications();
      } else {
        setResult({
          success: false,
          message: data.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateInvite = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/debug/notifications?action=simulate-invite');
      const data = await res.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: 'Convite de lobby simulado com sucesso'
        });
        
        // Notificações de convite são tratadas de forma especial, não aparecem na lista padrão
        // Então aqui não atualizamos a lista
      } else {
        setResult({
          success: false,
          message: data.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro ao simular convite de lobby:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setLoading(true);
      
      const res = await fetch('/api/debug/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: notificationId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: data.data.message || 'Notificação marcada como lida'
        });
        
        // Atualizar localmente para uma experiência mais responsiva
        setNotifications(prev => 
          prev.map(n => 
            (n.id === notificationId || n._id === notificationId) 
              ? { ...n, read: true } 
              : n
          )
        );
      } else {
        setResult({
          success: false,
          message: data.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      
      const res = await fetch('/api/debug/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ all: 'true' }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: data.data.message || 'Todas as notificações marcadas como lidas'
        });
        
        // Atualizar localmente para uma experiência mais responsiva
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        );
      } else {
        setResult({
          success: false,
          message: data.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  const respondToInvite = async (inviteId: string, response: 'accept' | 'reject') => {
    try {
      setLoading(true);
      
      const res = await fetch('/api/debug/notifications?action=respond-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId, response }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResult({
          success: true,
          message: data.data.message || 
            (response === 'accept' ? 'Convite aceito' : 'Convite recusado')
        });
        
        // Atualizar a lista localmente
        setNotifications(prev => 
          prev.map(n => 
            (n.id === inviteId || n._id === inviteId) 
              ? { ...n, status: data.data.status } 
              : n
          )
        );
        
        // Recarregar as notificações após um breve delay
        setTimeout(() => {
          fetchNotifications();
        }, 500);
      } else {
        setResult({
          success: false,
          message: data.error || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error(`Erro ao ${response === 'accept' ? 'aceitar' : 'recusar'} convite:`, error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar as notificações de acordo com a aba selecionada
  const filteredNotifications = () => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'lobby_invites') return notifications.filter(n => n.type === 'lobby_invite');
    return notifications.filter(n => n.type !== 'lobby_invite');
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
      </div>
    );
  }

  // Comentar esta verificação para permitir acesso mesmo quando a autenticação não é reconhecida
  // if (status === 'unauthenticated') {
  //   return (
  //     <div className="container mx-auto p-4">
  //       <h1 className="text-2xl font-bold mb-4">Depuração de Notificações</h1>
  //       <div className="bg-red-100 p-4 rounded-md">
  //         <p className="text-red-700">Você precisa estar autenticado para acessar esta página.</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Depuração de Notificações</h1>
      
      {/* Adicionar informações de autenticação no topo */}
      <div className="mb-4 p-3 bg-slate-700 rounded text-sm overflow-auto text-white">
        <h3 className="font-semibold mb-2">Informações de autenticação:</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><span className="text-slate-300">Status:</span> {status}</p>
            <p><span className="text-slate-300">Usuário:</span> {session?.user?.name || 'N/A'}</p>
            <p><span className="text-slate-300">Email:</span> {session?.user?.email || 'N/A'}</p>
          </div>
          <div className="text-right">
            <button 
              onClick={() => setForceDev(!forceDev)}
              className={`px-3 py-1 rounded text-sm ${
                forceDev ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <User className="inline-block h-4 w-4 mr-1" />
              {forceDev ? 'Usando Usuário de Teste' : 'Usar Usuário de Teste'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-700 p-4 rounded-lg mb-6">
        <div className="flex gap-2 mb-6">
          <button 
            onClick={fetchNotifications}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-600"
          >
            <RefreshCcw size={18} />
            Atualizar
          </button>
          
          <button 
            onClick={clearNotifications}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-red-600"
          >
            <Trash size={18} />
            Limpar
          </button>
          
          <button 
            onClick={simulateInvite}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-purple-600"
          >
            <Users size={18} />
            Simular Convite
          </button>
        </div>
        
        {result && (
          <div className={`mb-6 p-4 rounded-md ${result.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
            <p>{result.message}</p>
          </div>
        )}
      </div>
      
      <div className="mb-6 p-4 border border-slate-600 rounded-md bg-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-white">Criar Nova Notificação</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-slate-300">Tipo:</label>
            <select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value)}
              className="w-full p-2 border rounded-md bg-slate-800 text-white border-slate-600"
            >
              <option value="system">Sistema</option>
              <option value="payment">Pagamento</option>
              <option value="match">Partida</option>
              <option value="verification">Verificação</option>
              <option value="friend_request">Solicitação de Amizade</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 text-slate-300">Título:</label>
            <input
              type="text"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              placeholder="Título da notificação"
              className="w-full p-2 border rounded-md bg-slate-800 text-white border-slate-600"
            />
          </div>
          
          <div>
            <label className="block mb-1 text-slate-300">Mensagem:</label>
            <textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Mensagem da notificação"
              className="w-full p-2 border rounded-md bg-slate-800 text-white border-slate-600"
              rows={3}
            />
          </div>
          
          <button
            onClick={createNotification}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-600"
          >
            <Plus size={18} />
            Criar Notificação
          </button>
        </div>
      </div>
      
      <div className="bg-slate-700 p-4 rounded-lg">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2 text-white">Notificações ({notifications.length})</h2>
          
          {/* Tabs para filtrar por tipo */}
          <div className="flex border-b border-slate-600 mb-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-4 ${
                activeTab === 'all' 
                  ? 'border-b-2 border-blue-500 text-blue-400' 
                  : 'text-slate-400'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('regular')}
              className={`py-2 px-4 ${
                activeTab === 'regular' 
                  ? 'border-b-2 border-blue-500 text-blue-400' 
                  : 'text-slate-400'
              }`}
            >
              Notificações ({notifications.filter(n => n.type !== 'lobby_invite').length})
            </button>
            <button
              onClick={() => setActiveTab('lobby_invites')}
              className={`py-2 px-4 ${
                activeTab === 'lobby_invites' 
                  ? 'border-b-2 border-blue-500 text-blue-400' 
                  : 'text-slate-400'
              }`}
            >
              Convites ({notifications.filter(n => n.type === 'lobby_invite').length})
            </button>
          </div>
          
          {/* Botão para marcar todas como lidas */}
          {notifications.filter(n => !n.read).length > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={loading}
              className="ml-auto flex items-center gap-1 text-sm bg-blue-500/20 text-blue-300 px-3 py-1 rounded hover:bg-blue-500/30"
            >
              <span className="text-xs">✓</span> Marcar todas como lidas
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="text-center p-4 text-slate-300">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Carregando...</p>
          </div>
        ) : filteredNotifications().length === 0 ? (
          <div className="text-center p-4 text-slate-400">
            <Bell size={48} className="mx-auto mb-2 opacity-30" />
            <p>Nenhuma notificação encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications().map((notification) => (
              <div 
                key={notification.id || notification._id} 
                className={`p-4 border border-slate-600 rounded-md ${notification.type === 'lobby_invite' ? 'bg-purple-500/10' : 'bg-slate-800'}`}
              >
                <div className="flex justify-between">
                  <span className="font-semibold text-white">{notification.title || notification.type}</span>
                  <div className="flex gap-2">
                    {notification.type === 'lobby_invite' && (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300">
                        Convite
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${notification.read ? 'bg-slate-600 text-slate-300' : 'bg-blue-500/20 text-blue-300'}`}>
                      {notification.read ? 'Lida' : 'Não lida'}
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 mt-2">{notification.message}</p>
                <div className="flex justify-between mt-2 text-sm text-slate-400">
                  <span>Tipo: {notification.type}</span>
                  <span>
                    {new Date(notification.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                {notification.data && (
                  <div className="mt-2 pt-2 border-t border-slate-600 text-sm">
                    <details>
                      <summary className="cursor-pointer text-slate-300">Dados adicionais</summary>
                      <pre className="mt-2 p-2 bg-slate-900 rounded-md overflow-x-auto text-slate-300 text-xs">
                        {JSON.stringify(notification.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                
                {/* Botões de ação */}
                {!notification.read && (
                  <div className="mt-3 flex justify-end gap-2">
                    {notification.type === 'lobby_invite' && (
                      <>
                        <button
                          onClick={() => respondToInvite(notification.id || notification._id, 'accept')}
                          disabled={loading}
                          className="bg-green-500 text-white px-3 py-1 text-sm rounded hover:bg-green-600"
                        >
                          Aceitar Convite
                        </button>
                        <button
                          onClick={() => respondToInvite(notification.id || notification._id, 'reject')}
                          disabled={loading}
                          className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600"
                        >
                          Recusar
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => markAsRead(notification.id || notification._id)}
                      disabled={loading}
                      className="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
                    >
                      Marcar como lida
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 