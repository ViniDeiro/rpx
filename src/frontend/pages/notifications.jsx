import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Check, Info, AlertCircle, Clock, Trash2, RefreshCw } from 'react-feather';
import { format, formatDistanceToNow } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';

/**
 * Página de notificações
 * Exibe todas as notificações do usuário com opções de filtragem
 */
const NotificationsPage = () => {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Buscar notificações ao carregar
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      router.push('/login?redirect=notifications');
    }
  }, [isAuthenticated, filterType, filterRead]);

  // Agrupar notificações por data
  const groupedNotifications = () => {
    const groups = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toLocaleDateString('pt-BR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });
    
    return groups;
  };

  // Buscar notificações da API
  const fetchNotifications = async (loadMore = false) => {
    if (!isAuthenticated) return;
    
    try {
      const newPage = loadMore ? page + 1 : 0;
      
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPage(0);
      }
      
      // Construir query params
      let queryParams = `limit=20&offset=${newPage * 20}`;
      if (filterType) queryParams += `&type=${filterType}`;
      if (filterRead) queryParams += `&read=${filterRead === 'read'}`;
      
      const response = await axios.get(`/api/notifications?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const { data } = response.data;
      
      if (loadMore) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      
      setTotalUnread(data.pagination.unreadCount);
      setPage(newPage);
      setHasMore(data.notifications.length === 20);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Marcar notificação como lida
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Atualizar contagem
      setTotalUnread(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      
      // Parâmetros adicionais para manter a filtragem atual
      let queryParams = '';
      if (filterType) queryParams += `?type=${filterType}`;
      
      await axios.put(`/api/notifications/read-all${queryParams}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Zerar contagem se não houver filtro
      if (!filterType) {
        setTotalUnread(0);
      } else {
        // Atualizar contagem
        fetchNotifications();
      }
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Excluir uma notificação
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`/api/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remover do estado local
      setNotifications(prev => 
        prev.filter(notification => notification._id !== notificationId)
      );
      
      // Atualizar contagem se a notificação não estava lida
      const wasUnread = notifications.find(n => n._id === notificationId && !n.read);
      if (wasUnread) {
        setTotalUnread(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  };

  // Excluir todas as notificações
  const deleteAllNotifications = async () => {
    try {
      setIsDeleting(true);
      
      // Parâmetros adicionais para manter a filtragem atual
      let queryParams = '';
      if (filterType) queryParams += `?type=${filterType}`;
      if (filterRead) {
        queryParams += queryParams ? '&' : '?';
        queryParams += `read=${filterRead === 'read'}`;
      }
      
      await axios.delete(`/api/notifications${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Limpar estado local
      setNotifications([]);
      
      // Atualizar contagem
      if (!filterRead || filterRead === 'unread') {
        if (!filterType) {
          setTotalUnread(0);
        } else {
          fetchNotifications();
        }
      }
    } catch (error) {
      console.error('Erro ao excluir todas notificações:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Acessar ação da notificação
  const handleAction = (notification) => {
    if (notification.action && notification.action.type === 'navigate') {
      router.push(notification.action.target);
      
      // Se não estiver lida, marcar como lida
      if (!notification.read) {
        markAsRead(notification._id);
      }
    }
  };

  // Obter ícone com base no tipo de notificação
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'welcome':
      case 'system_announcement':
      case 'email_verified':
      case 'account_update':
        return <Info className="text-blue-500" size={20} />;
      case 'match_invitation':
      case 'match_accepted':
      case 'match_rejected':
      case 'match_canceled':
      case 'match_reminder':
      case 'match_result':
        return <Clock className="text-purple-500" size={20} />;
      case 'transaction_completed':
      case 'deposit_received':
      case 'withdrawal_processed':
      case 'refund_processed':
      case 'bonus_received':
        return <Check className="text-green-500" size={20} />;
      case 'match_dispute':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <Info className="text-gray-500" size={20} />;
    }
  };

  // Formatar data relativa
  const formatDate = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    
    // Se for hoje, mostrar apenas a hora
    if (notificationDate.toDateString() === now.toDateString()) {
      return format(notificationDate, "'Hoje às' HH:mm", { locale: ptBR });
    }
    
    // Se for nos últimos 7 dias, mostrar o dia da semana
    const differenceInDays = Math.floor((now - notificationDate) / (1000 * 60 * 60 * 24));
    if (differenceInDays < 7) {
      return formatDistanceToNow(notificationDate, { 
        addSuffix: true,
        locale: ptBR
      });
    }
    
    // Caso contrário, mostrar a data completa
    return format(notificationDate, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  // Formatar nome da categoria
  const formatNotificationType = (type) => {
    const typeNames = {
      welcome: 'Boas-vindas',
      system_announcement: 'Anúncios',
      email_verified: 'Verificação',
      account_update: 'Conta',
      match_invitation: 'Convite',
      match_accepted: 'Partida',
      match_rejected: 'Partida',
      match_canceled: 'Partida',
      match_reminder: 'Lembrete',
      match_result: 'Resultado',
      match_dispute: 'Disputa',
      transaction_completed: 'Transação',
      deposit_received: 'Depósito',
      withdrawal_processed: 'Saque',
      refund_processed: 'Reembolso',
      bonus_received: 'Bônus',
      friend_request: 'Social',
      team_invitation: 'Equipe',
      tournament_invitation: 'Torneio'
    };
    
    return typeNames[type] || 'Geral';
  };

  // Renderizar notificação
  const renderNotification = (notification) => {
    return (
      <div 
        key={notification._id}
        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${notification.read ? 'opacity-75' : 'bg-blue-50'}`}
      >
        <div className="flex items-start">
          <div className="mr-3 mt-1">
            {getNotificationIcon(notification.type)}
          </div>
          
          <div 
            className="flex-1 cursor-pointer" 
            onClick={() => handleAction(notification)}
          >
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900">{notification.title}</h3>
              <span className="text-xs text-gray-500 ml-2">
                {formatDate(notification.createdAt)}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
            
            <div className="flex items-center mt-2">
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full mr-2">
                {formatNotificationType(notification.type)}
              </span>
              
              {notification.action && notification.action.type === 'navigate' && (
                <span className="text-xs text-blue-500 hover:underline cursor-pointer">
                  Ver detalhes
                </span>
              )}
            </div>
          </div>
          
          <div className="ml-2 flex items-center space-x-1">
            {!notification.read && (
              <button 
                className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                onClick={() => markAsRead(notification._id)}
                title="Marcar como lida"
              >
                <Check size={16} />
              </button>
            )}
            
            <button 
              className="p-1 text-red-500 hover:bg-red-50 rounded"
              onClick={() => deleteNotification(notification._id)}
              title="Excluir notificação"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
                Suas Notificações
                {totalUnread > 0 && (
                  <span className="ml-2 text-sm font-medium bg-red-500 text-white py-1 px-2 rounded-full">
                    {totalUnread} não {totalUnread === 1 ? 'lida' : 'lidas'}
                  </span>
                )}
              </h1>
              
              <div className="flex flex-col sm:flex-row gap-2">
                {totalUnread > 0 && (
                  <button
                    className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 flex items-center justify-center disabled:opacity-50"
                    onClick={markAllAsRead}
                    disabled={isMarkingAll}
                  >
                    {isMarkingAll ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Check size={16} className="mr-2" />
                    )}
                    Marcar todas como lidas
                  </button>
                )}
                
                <button
                  className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 flex items-center justify-center disabled:opacity-50"
                  onClick={deleteAllNotifications}
                  disabled={isDeleting || notifications.length === 0}
                >
                  {isDeleting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Trash2 size={16} className="mr-2" />
                  )}
                  Excluir todas
                </button>
              </div>
            </div>
            
            {/* Filtros */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por tipo
                </label>
                <select
                  id="type-filter"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  <option value="system_announcement">Anúncios do sistema</option>
                  <option value="match_invitation">Convites para partidas</option>
                  <option value="match_result">Resultados de partidas</option>
                  <option value="transaction_completed">Transações</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label htmlFor="read-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por status
                </label>
                <select
                  id="read-filter"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={filterRead}
                  onChange={(e) => setFilterRead(e.target.value)}
                >
                  <option value="">Todas</option>
                  <option value="unread">Não lidas</option>
                  <option value="read">Lidas</option>
                </select>
              </div>
              
              <div className="flex-none pt-6">
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center"
                  onClick={() => fetchNotifications()}
                  aria-label="Atualizar"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Atualizar
                </button>
              </div>
            </div>
          </div>
          
          {/* Conteúdo */}
          <div className="bg-white">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <LoadingSpinner />
              </div>
            ) : notifications.length > 0 ? (
              <div>
                {Object.entries(groupedNotifications()).map(([date, items]) => (
                  <div key={date}>
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 border-y border-gray-100">
                      <h3 className="text-sm font-medium text-gray-500">{date}</h3>
                    </div>
                    <div>
                      {items.map(renderNotification)}
                    </div>
                  </div>
                ))}
                
                {hasMore && (
                  <div className="p-4 text-center">
                    <button
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50"
                      onClick={() => fetchNotifications(true)}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Carregando...' : 'Carregar mais'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Info size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação encontrada</h3>
                <p className="text-gray-500">
                  {filterType || filterRead ? 
                    'Não há notificações que correspondam aos filtros aplicados.' : 
                    'Você não tem notificações no momento.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage; 