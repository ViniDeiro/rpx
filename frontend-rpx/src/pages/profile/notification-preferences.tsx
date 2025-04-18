import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Bell, Mail, AlertTriangle, Coffee, DollarSign, Award, Calendar, Users } from 'react-feather';
import axios from 'axios';
import { toast } from 'react-toastify';
import { PushNotificationService } from '@/services/push/pushNotificationService';

interface NotificationPreferences {
  email: {
    marketing: boolean;
    updates: boolean;
    matches: boolean;
    payments: boolean;
    tournaments: boolean;
    friends: boolean;
  };
  push: {
    matches: boolean;
    payments: boolean;
    tournaments: boolean;
    friends: boolean;
    updates: boolean;
  };
}

export default function NotificationPreferences() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushAvailable, setPushAvailable] = useState(false);
  const [pushPermission, setPushPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [enablePushLoading, setEnablePushLoading] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      marketing: true,
      updates: true,
      matches: true,
      payments: true,
      tournaments: true,
      friends: true
    },
    push: {
      matches: true,
      payments: true,
      tournaments: true,
      friends: true,
      updates: true
    }
  });

  // Verificar se notificações push são suportadas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPushAvailable('Notification' in window);
      if ('Notification' in window) {
        setPushPermission(Notification.permission as 'granted' | 'denied' | 'default');
      }
    }
  }, []);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/profile/notification-preferences');
    }
  }, [status, router]);

  // Carregar preferências do usuário
  useEffect(() => {
    async function loadPreferences() {
      if (session?.user?.id) {
        try {
          const response = await axios.get('/api/users/notification-preferences');
          if (response.data.success) {
            setPreferences(response.data.preferences);
          }
        } catch (error) {
          console.error('Erro ao carregar preferências:', error);
          toast.error('Não foi possível carregar suas preferências de notificação');
        } finally {
          setLoading(false);
        }
      }
    }

    if (session?.user) {
      loadPreferences();
    }
  }, [session]);

  // Salvar preferências
  const savePreferences = async () => {
    if (!session?.user?.id) return;
    
    setSaving(true);
    try {
      const response = await axios.post('/api/users/notification-preferences', {
        preferences
      });
      
      if (response.data.success) {
        toast.success('Preferências de notificação salvas com sucesso');
      } else {
        toast.error('Erro ao salvar preferências');
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências de notificação');
    } finally {
      setSaving(false);
    }
  };

  // Habilitar notificações push
  const enablePushNotifications = async () => {
    if (!session?.user?.id) return;
    
    setEnablePushLoading(true);
    try {
      // Inicializar serviço
      PushNotificationService.initialize();
      
      // Solicitar permissão
      const permission = await PushNotificationService.requestPermission();
      setPushPermission(Notification.permission as 'granted' | 'denied' | 'default');
      
      if (permission) {
        // Obter token
        const token = await PushNotificationService.getToken();
        
        if (token) {
          // Salvar token
          const success = await PushNotificationService.saveToken(
            session.user.id,
            token
          );
          
          if (success) {
            toast.success('Notificações push habilitadas com sucesso');
          } else {
            toast.error('Erro ao registrar dispositivo para notificações');
          }
        } else {
          toast.error('Não foi possível obter token do dispositivo');
        }
      } else {
        toast.warn('Permissão para notificações negada. Verifique as configurações do seu navegador.');
      }
    } catch (error) {
      console.error('Erro ao habilitar notificações push:', error);
      toast.error('Erro ao habilitar notificações push');
    } finally {
      setEnablePushLoading(false);
    }
  };

  // Mudança em um toggle
  const handleToggleChange = (type: 'email' | 'push', key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value
      }
    }));
  };

  // Se estiver carregando ou usuário não estiver autenticado, mostrar loading
  if (loading || status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="h-48 bg-gray-800 rounded mb-6"></div>
            <div className="h-48 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-card-bg border border-border rounded-xl p-6 shadow-lg">
        <div className="flex items-center mb-6">
          <Bell className="text-primary mr-3" size={28} />
          <h1 className="text-2xl font-bold">Preferências de Notificação</h1>
        </div>

        {/* Seção de notificações por email */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Mail className="text-primary mr-2" size={20} />
            <h2 className="text-xl font-semibold">Notificações por Email</h2>
          </div>
          
          <div className="space-y-4 pl-2">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-start">
                <Calendar className="text-foreground-muted mr-3 mt-1" size={18} />
                <div>
                  <p className="font-medium">Partidas e Desafios</p>
                  <p className="text-sm text-foreground-muted">Receba emails sobre novas partidas, convites e resultados</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={preferences.email.matches}
                  onChange={(e) => handleToggleChange('email', 'matches', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-start">
                <DollarSign className="text-foreground-muted mr-3 mt-1" size={18} />
                <div>
                  <p className="font-medium">Pagamentos e Transações</p>
                  <p className="text-sm text-foreground-muted">Confirmaçõees de pagamentos, depósitos e saques</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={preferences.email.payments}
                  onChange={(e) => handleToggleChange('email', 'payments', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-start">
                <Award className="text-foreground-muted mr-3 mt-1" size={18} />
                <div>
                  <p className="font-medium">Torneios</p>
                  <p className="text-sm text-foreground-muted">Informações sobre torneios, convites e premiações</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={preferences.email.tournaments}
                  onChange={(e) => handleToggleChange('email', 'tournaments', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-start">
                <Users className="text-foreground-muted mr-3 mt-1" size={18} />
                <div>
                  <p className="font-medium">Amigos e Social</p>
                  <p className="text-sm text-foreground-muted">Solicitações de amizade e mensagens</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={preferences.email.friends}
                  onChange={(e) => handleToggleChange('email', 'friends', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-start">
                <AlertTriangle className="text-foreground-muted mr-3 mt-1" size={18} />
                <div>
                  <p className="font-medium">Atualizações do Sistema</p>
                  <p className="text-sm text-foreground-muted">Notificações importantes sobre a plataforma</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={preferences.email.updates}
                  onChange={(e) => handleToggleChange('email', 'updates', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="flex items-start">
                <Coffee className="text-foreground-muted mr-3 mt-1" size={18} />
                <div>
                  <p className="font-medium">Marketing e Promoções</p>
                  <p className="text-sm text-foreground-muted">Ofertas, promoções e novidades da RPX.GG</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={preferences.email.marketing}
                  onChange={(e) => handleToggleChange('email', 'marketing', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Seção de notificações push */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Bell className="text-primary mr-2" size={20} />
            <h2 className="text-xl font-semibold">Notificações Push</h2>
          </div>
          
          {!pushAvailable ? (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 flex items-center">
                <AlertTriangle size={18} className="mr-2" />
                Seu navegador não suporta notificações push.
              </p>
            </div>
          ) : pushPermission !== 'granted' ? (
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-blue-300 flex items-center mb-3">
                <AlertTriangle size={18} className="mr-2" />
                Você precisa permitir notificações para receber alertas em tempo real.
              </p>
              <button
                onClick={enablePushNotifications}
                disabled={enablePushLoading}
                className="bg-primary hover:bg-primary-dark text-white rounded px-4 py-2 flex items-center"
              >
                {enablePushLoading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Habilitando...
                  </>
                ) : (
                  <>
                    <Bell size={16} className="mr-2" />
                    Habilitar Notificações
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4 pl-2">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-start">
                  <Calendar className="text-foreground-muted mr-3 mt-1" size={18} />
                  <div>
                    <p className="font-medium">Partidas e Desafios</p>
                    <p className="text-sm text-foreground-muted">Novas partidas, convites e resultados</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={preferences.push.matches}
                    onChange={(e) => handleToggleChange('push', 'matches', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-start">
                  <DollarSign className="text-foreground-muted mr-3 mt-1" size={18} />
                  <div>
                    <p className="font-medium">Pagamentos e Transações</p>
                    <p className="text-sm text-foreground-muted">Confirmaçõees de pagamentos e saques</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={preferences.push.payments}
                    onChange={(e) => handleToggleChange('push', 'payments', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-start">
                  <Award className="text-foreground-muted mr-3 mt-1" size={18} />
                  <div>
                    <p className="font-medium">Torneios</p>
                    <p className="text-sm text-foreground-muted">Início de partidas e resultados de torneios</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={preferences.push.tournaments}
                    onChange={(e) => handleToggleChange('push', 'tournaments', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-start">
                  <Users className="text-foreground-muted mr-3 mt-1" size={18} />
                  <div>
                    <p className="font-medium">Amigos e Social</p>
                    <p className="text-sm text-foreground-muted">Solicitações de amizade e mensagens</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={preferences.push.friends}
                    onChange={(e) => handleToggleChange('push', 'friends', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-start">
                  <AlertTriangle className="text-foreground-muted mr-3 mt-1" size={18} />
                  <div>
                    <p className="font-medium">Atualizações do Sistema</p>
                    <p className="text-sm text-foreground-muted">Notificações importantes sobre a plataforma</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={preferences.push.updates}
                    onChange={(e) => handleToggleChange('push', 'updates', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-border rounded-md hover:bg-card-hover transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          
          <button
            onClick={savePreferences}
            disabled={saving}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md transition-colors flex items-center"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Salvando...
              </>
            ) : (
              <>Salvar Preferências</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 