import { useState, useEffect, useContext, createContext } from 'react';
import io from 'socket.io-client';
import { useAuth } from './useAuth';

// Criar contexto para o socket
const SocketContext = createContext(null);

/**
 * Provedor de socket para a aplicação
 * @param {Object} props - Propriedades do componente
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { isAuthenticated, token } = useAuth();
  
  // Efeito para gerenciar a conexão do socket
  useEffect(() => {
    let socketInstance = null;
    
    // Conectar ao socket apenas se o usuário estiver autenticado
    if (isAuthenticated && token) {
      // Obter a URL da API do seu .env ou configuração
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      
      // Inicializar socket.io com o token de autenticação
      socketInstance = io(API_URL, {
        auth: {
          token
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      // Manipuladores de eventos de conexão
      socketInstance.on('connect', () => {
        console.log('Socket conectado!');
      });
      
      socketInstance.on('connect_error', (err) => {
        console.error('Erro de conexão do socket:', err.message);
      });
      
      socketInstance.on('disconnect', (reason) => {
        console.log('Socket desconectado:', reason);
      });
      
      // Atualizar estado
      setSocket(socketInstance);
    }
    
    // Limpar na desmontagem
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
      }
    };
  }, [isAuthenticated, token]);
  
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook para usar o socket em componentes
 * @returns {Object|null} Instância do socket ou null se não conectado
 */
export function useSocket() {
  return useContext(SocketContext);
} 