import React, { useState, useEffect } from 'react';
import { Bell } from 'react-feather';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import NotificationCenter from './NotificationCenter';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session } = useSession();
  
  useEffect(() => {
    if (session?.user) {
      fetchNotificationCount();
      // Configurar polling para atualizar as notificações a cada 30 segundos
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);
  
  const fetchNotificationCount = async () => {
    try {
      const response = await axios.get('/api/notifications/count');
      if (response.data.status === 'success') {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Erro ao buscar contagem de notificações:', error);
    }
  };
  
  const toggleNotificationCenter = () => {
    setIsOpen(!isOpen);
    // Se estiver abrindo, resetar contador
    if (!isOpen) {
      // Apenas resetar visualmente, a marcação real como lida
      // acontece no NotificationCenter
    }
  };
  
  return (
    <>
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={toggleNotificationCenter}
          className="bg-primary hover:bg-primary-dark text-white rounded-full p-3 shadow-lg flex items-center justify-center relative"
          aria-label="Notificações"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      
      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
} 