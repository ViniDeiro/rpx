import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

interface Friend {
  id: string;
  username: string;
  avatar?: string;
  online?: boolean;
}

interface Lobby {
  _id: string;
  name: string;
  ownerId: string;
  members: string[];
  createdAt: string;
  gameMode?: string;
}

interface NotificationTestProps {}

export default function NotificationTestPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [lobbies, setLobbies] = useState<Lobby[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingLobbies, setLoadingLobbies] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [selectedLobby, setSelectedLobby] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchFriends();
      fetchLobbies();
      fetchNotifications();
    }
  }, [session]);

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      const response = await axios.get('/api/users/friends');
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Erro ao buscar amigos:', error);
      toast.error('Erro ao buscar lista de amigos');
    } finally {
      setLoadingFriends(false);
    }
  };

  const fetchLobbies = async () => {
    try {
      setLoadingLobbies(true);
      const response = await axios.get('/api/lobbies/my');
      setLobbies(response.data.lobbies || []);
    } catch (error) {
      console.error('Erro ao buscar lobbies:', error);
      toast.error('Erro ao buscar seus lobbies');
    } finally {
      setLoadingLobbies(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications || []);
      setDebugInfo({
        unreadCount: response.data.unreadCount,
        totalCount: response.data.notifications?.length || 0
      });
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      toast.error('Erro ao buscar notificações');
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!selectedFriend || !selectedLobby) {
      toast.warn('Selecione um amigo e um lobby');
      return;
    }

    try {
      setSendingInvite(true);
      const response = await axios.post('/api/lobby/invite', {
        recipientId: selectedFriend,
        lobbyId: selectedLobby
      });

      if (response.data.status === 'success') {
        toast.success('Convite enviado com sucesso!');
        // Atualizar o debug info
        setTimeout(fetchNotifications, 1000);
      } else {
        toast.error(response.data.error || 'Erro ao enviar convite');
      }
    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      toast.error(error.response?.data?.error || 'Erro ao enviar convite');
    } finally {
      setSendingInvite(false);
    }
  };

  const createTestLobby = async () => {
    try {
      const response = await axios.post('/api/lobbies', {
        name: `Lobby de Teste ${new Date().toLocaleTimeString()}`,
        gameMode: 'casual',
        maxPlayers: 6,
        isPublic: true
      });

      if (response.data.status === 'success') {
        toast.success('Lobby de teste criado!');
        fetchLobbies();
      }
    } catch (error) {
      console.error('Erro ao criar lobby de teste:', error);
      toast.error('Erro ao criar lobby de teste');
    }
  };

  const refreshData = () => {
    fetchFriends();
    fetchLobbies();
    fetchNotifications();
    toast.info('Dados atualizados!');
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Se o usuário não estiver logado, redirecionar para login
  if (!session) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
        <p className="mb-4">Esta área é restrita a desenvolvedores autenticados.</p>
        <Button 
          onClick={() => router.push('/auth/login')}
          variant="default"
        >
          Fazer Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Ferramentas de Teste de Notificações</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna de debug */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
              <CardDescription>Informações para debug do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Status</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted p-2 rounded">Usuário ID:</div>
                    <div className="bg-card p-2 rounded">{session.user.id}</div>
                    
                    <div className="bg-muted p-2 rounded">Username:</div>
                    <div className="bg-card p-2 rounded">{session.user.name}</div>
                    
                    <div className="bg-muted p-2 rounded">Total Notificações:</div>
                    <div className="bg-card p-2 rounded">{debugInfo?.totalCount || 0}</div>
                    
                    <div className="bg-muted p-2 rounded">Não Lidas:</div>
                    <div className="bg-card p-2 rounded">{debugInfo?.unreadCount || 0}</div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={refreshData} variant="outline" size="sm">
                    Atualizar Dados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={createTestLobby} 
                variant="outline" 
                className="w-full"
              >
                Criar Lobby de Teste
              </Button>
              
              <Button 
                onClick={fetchNotifications} 
                variant="outline" 
                className="w-full"
              >
                Verificar Notificações
              </Button>
              
              <Button 
                onClick={() => router.push('/')}
                variant="ghost" 
                className="w-full"
              >
                Voltar para App
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Coluna principal */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="invite">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="invite">Criar Convite</TabsTrigger>
              <TabsTrigger value="notifications">Verificar Notificações</TabsTrigger>
            </TabsList>
            
            {/* Tab de criar convite */}
            <TabsContent value="invite">
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Convite para Lobby</CardTitle>
                  <CardDescription>
                    Selecione um amigo e um lobby para enviar um convite de teste
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Seleção de amigo */}
                    <div>
                      <Label htmlFor="friend-select" className="block mb-2">Selecione um Amigo</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {loadingFriends ? (
                          <div className="col-span-full text-center p-4">
                            Carregando amigos...
                          </div>
                        ) : friends.length === 0 ? (
                          <div className="col-span-full text-center p-4">
                            Nenhum amigo encontrado
                          </div>
                        ) : (
                          friends.map(friend => (
                            <div 
                              key={friend.id}
                              className={`p-2 border rounded-md cursor-pointer transition-colors ${
                                selectedFriend === friend.id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => setSelectedFriend(friend.id)}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-muted rounded-full overflow-hidden flex-shrink-0">
                                  {friend.avatar && (
                                    <img src={friend.avatar} alt={friend.username} className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <span className="truncate">{friend.username}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Seleção de lobby */}
                    <div>
                      <Label htmlFor="lobby-select" className="block mb-2">Selecione um Lobby</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {loadingLobbies ? (
                          <div className="col-span-full text-center p-4">
                            Carregando lobbies...
                          </div>
                        ) : lobbies.length === 0 ? (
                          <div className="col-span-full text-center p-4">
                            Nenhum lobby encontrado. Crie um primeiro.
                          </div>
                        ) : (
                          lobbies.map(lobby => (
                            <div 
                              key={lobby._id}
                              className={`p-2 border rounded-md cursor-pointer transition-colors ${
                                selectedLobby === lobby._id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'hover:bg-muted'
                              }`}
                              onClick={() => setSelectedLobby(lobby._id)}
                            >
                              <div className="space-y-1">
                                <div className="font-medium truncate">{lobby.name}</div>
                                <div className="text-xs opacity-70">
                                  Criado em: {new Date(lobby.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleCreateInvite}
                    disabled={!selectedFriend || !selectedLobby || sendingInvite}
                    className="w-full"
                  >
                    {sendingInvite ? 'Enviando...' : 'Enviar Convite'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Tab de notificações */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notificações Recentes</CardTitle>
                  <CardDescription>
                    Lista de notificações recuperadas do servidor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingNotifications ? (
                    <div className="text-center p-4">
                      Carregando notificações...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center p-4">
                      Nenhuma notificação encontrada
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                      {notifications.map((notification, index) => (
                        <div 
                          key={notification._id || index}
                          className={`p-3 border rounded-md ${!notification.read ? 'bg-muted/50' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">
                                {notification.type === 'lobby_invite' ? '🎮 Convite para Lobby' : notification.type}
                                {!notification.read && <span className="ml-2 text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">Novo</span>}
                              </div>
                              
                              <div className="text-sm mt-1">
                                {notification.type === 'lobby_invite' && (
                                  <span>
                                    De: {notification.inviterName || notification.data?.inviter?.username || 'Usuário'}
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-xs mt-2 opacity-70">
                                {formatDate(notification.createdAt)}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                ID: {(notification._id || '').substring(0, 8)}
                              </span>
                            </div>
                          </div>
                          
                          {notification.type === 'lobby_invite' && (
                            <div className="mt-2 pt-2 border-t text-xs">
                              <div>Status: {notification.status || notification.data?.invite?.status || 'unknown'}</div>
                              <div>Lobby ID: {(notification.lobbyId || notification.data?.invite?.lobbyId || '').substring(0, 8)}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={fetchNotifications}
                    variant="outline"
                    className="w-full"
                    disabled={loadingNotifications}
                  >
                    {loadingNotifications ? 'Atualizando...' : 'Atualizar Notificações'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Rodapé */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Esta é uma ferramenta de teste para desenvolvedores.</p>
        <p>Utilize apenas em ambiente de desenvolvimento.</p>
      </div>
    </div>
  );
} 