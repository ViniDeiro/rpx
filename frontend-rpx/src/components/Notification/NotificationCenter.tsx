import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

// Tipos para notificações
interface NotificationData {
  matchId?: string;
  transactionId?: string;
  amount?: number;
  status?: 'approved' | 'rejected';
}

interface Notification {
  id: string;
  userId: string;
  type: 'verification' | 'payment' | 'system' | 'match';
  title: string;
  message: string;
  read: boolean;
  data?: NotificationData;
  createdAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    total: number;
    unreadCount: number;
  };
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch notificações
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // Em produção, seria uma chamada real à API
      const response = await fetch('/api/notifications');
      
      if (!response.ok) {
        throw new Error('Falha ao buscar notificações');
      }
      
      const data: NotificationsResponse = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notificações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Marcar notificação como lida
  const markAsRead = async (id: string) => {
    try {
      // Otimista - atualiza UI imediatamente
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => prev - 1);
      
      // Em produção, seria uma chamada real à API
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao marcar notificação como lida');
      }
    } catch (error) {
      console.error('Erro ao marcar notificação:', error);
      // Reverter UI se falhar
      await fetchNotifications();
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida",
        variant: "destructive"
      });
    }
  };
  
  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      // Otimista - atualiza UI imediatamente
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      // Em produção, seria uma chamada real à API
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ all: 'true' }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao marcar todas notificações como lidas');
      }
    } catch (error) {
      console.error('Erro ao marcar todas notificações:', error);
      // Reverter UI se falhar
      await fetchNotifications();
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas",
        variant: "destructive"
      });
    }
  };
  
  // Carregar notificações ao abrir o popover
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);
  
  // Formatar data relativa
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin}m atrás`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };
  
  // Renderizar ícone baseado no tipo
  const renderIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      case 'payment':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'system':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'match':
        return <div className="w-2 h-2 bg-purple-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };
  
  // Filtrar notificações baseado na tab ativa
  const filteredNotifications = React.useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === activeTab);
  }, [notifications, activeTab]);
  
  // Skeleton loader para estado de carregamento
  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3">
          <Skeleton className="w-2 h-2 rounded-full mt-2" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" /> Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 p-2 bg-white">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="unread">Não lidas</TabsTrigger>
            <TabsTrigger value="verification">Verificações</TabsTrigger>
            <TabsTrigger value="payment">Pagamentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="p-4">
                {isLoading ? (
                  renderSkeleton()
                ) : filteredNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <Card 
                        key={notification.id} 
                        className={`p-3 ${!notification.read ? 'bg-slate-50' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-1">{renderIcon(notification.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium">{notification.title}</h4>
                              {!notification.read && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                              {!notification.read && (
                                <Badge 
                                  variant="outline" 
                                  className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                                >
                                  Nova
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-gray-500">Nenhuma notificação encontrada</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter; 