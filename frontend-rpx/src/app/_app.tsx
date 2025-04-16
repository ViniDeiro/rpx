import { useEffect } from 'react';
import { AppProps } from 'next/app';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

// Componente para atualizar notificações
const NotificationUpdater = () => {
  const { isAuthenticated } = useAuth();
  const { fetchNotifications } = useNotifications();

  useEffect(() => {
    // Atualizar notificações quando o componente é montado
    if (isAuthenticated) {
      fetchNotifications();
      
      // Configurar intervalo para buscar notificações a cada 15 segundos
      const interval = setInterval(() => {
        fetchNotifications();
      }, 15000);
      
      // Limpar intervalo quando o componente é desmontado
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchNotifications]);

  return null; // Este componente não renderiza nada
};

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <NotificationUpdater />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 