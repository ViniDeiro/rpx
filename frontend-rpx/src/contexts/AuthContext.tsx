'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { preloadImage } from '@/hooks/useImagePreload';

// Interface para o usuário que vem da API
type User = {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  cpf?: string;
  birthdate?: string;
  balance: number;
  createdAt: string;
  username?: string;
  level?: number;
  avatarId?: string;
  bannerId?: string;
  achievements?: string[];
  purchases?: string[];
  avatarUrl?: string; // URL da imagem de avatar personalizada
  bio?: string; // Biografia do usuário
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    twitch?: string;
    youtube?: string;
    discord?: string;
  };
  profile?: {
    name?: string;
    avatar?: string;
    bio?: string;
    location?: string;
    socialLinks?: {
      twitter?: string;
      instagram?: string;
      twitch?: string;
      youtube?: string;
      discord?: string;
      tiktok?: string;
    }
  };
  role?: string;
  wallet?: {
    balance: number;
    transactions?: any[];
  };
  stats?: {
    matches?: number;
    wins?: number;
    losses?: number;
    rankPoints?: number;
    earnings?: number;
  };
  rank?: {
    tier: string;
    division: string | null;
    points: number;
  };
};

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSimulatedMode: boolean; // Mantido para compatibilidade, mas sempre será false
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User> & { currentPassword?: string, newPassword?: string }) => Promise<void>;
  updateUserProfile: (userData: Partial<User>) => Promise<void>; // Novo método para atualizar perfil
  updateCustomization: (type: 'avatar' | 'banner', itemId: string) => Promise<void>;
  updateUserAvatar: (file: File) => Promise<void>; // Nova função para fazer upload de avatar
  refreshUser: () => Promise<void>; // Nova função para atualizar os dados do usuário
  updateUserBalance: (newBalance: number) => void; // Nova função para atualizar o saldo do usuário localmente
}

// Criando o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para gerar username a partir do nome
const generateUsername = (name: string): string => {
  // Remove espaços e caracteres especiais
  const baseUsername = name
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '_');
  
  // Adiciona um sufixo aleatório para garantir unicidade
  const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `${baseUsername}_${randomSuffix}`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulatedMode, setIsSimulatedMode] = useState(false); // Mantido, mas sempre será false
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Função para salvar o token e dados do usuário
  const saveAuthData = (token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Função para limpar dados de autenticação
  const clearAuthData = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_login');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Verificar se existe token salvo
        const storedToken = localStorage.getItem('auth_token');
        const storedUserData = localStorage.getItem('user_data');
        
        // Se não houver token, limpar dados
        if (!storedToken) {
          clearAuthData();
          setIsLoading(false);
          return;
        }

        // Se houver dados do usuário salvos, restaurar
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            setToken(storedToken);
            setUser(userData);
            setIsAuthenticated(true);

            // Verificar validade do token
            const tokenParts = storedToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              
              if (payload.exp) {
                const expirationTime = payload.exp * 1000;
                const currentTime = Date.now();
                
                // Se o token expirou, tentar renovar
                if (currentTime >= expirationTime) {
                  const refreshResponse = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${storedToken}`
                    }
                  });
                  
                  if (refreshResponse.ok) {
                    const { token: newToken, user: refreshedUser } = await refreshResponse.json();
                    saveAuthData(newToken, refreshedUser);
                  } else {
                    // Se não conseguir renovar, fazer logout apenas se não estiver na página de login
                    if (!window.location.pathname.includes('/login')) {
                      clearAuthData();
                      router.push('/login');
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('Erro ao processar dados salvos:', error);
            // Se houver erro ao processar os dados, mas ainda estiver na página de login, não limpar
            if (!window.location.pathname.includes('/login')) {
              clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        // Se houver erro, mas ainda estiver na página de login, não limpar
        if (!window.location.pathname.includes('/login')) {
          clearAuthData();
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função de login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Salvar dados de autenticação
      saveAuthData(data.token, data.user);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Função de registro
  const register = async (userData: any) => {
    setIsLoading(true);
    
    try {
      // Preparar dados para registro com rank inicial
      const registrationData = {
        ...userData,
        // Gerar um username se não for fornecido
        username: userData.username || (userData.name ? generateUsername(userData.name) : undefined),
        // Adicionar rank inicial
        rank: {
          tier: 'unranked',
          division: null,
          points: 0
        }
      };
      
      // Fazer a requisição para a API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao registrar usuário');
      }
      
      const data = await response.json();
      
      // Salvar o token no localStorage e no estado
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token);
      }
      
      // Garantir que o usuário tenha um rank inicial
      const userWithRank = {
        ...data.user,
        rank: data.user.rank || {
          tier: 'unranked',
          division: null,
          points: 0
        }
      };
      
      setToken(data.token);
      setUser(userWithRank);

      // Redirecionar para a página de login após registro bem-sucedido
      router.push('/login?registered=true');
    } catch (error: any) {
      console.error('Erro no registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar dados do perfil do usuário
  const updateUser = async (userData: Partial<User> & { currentPassword?: string, newPassword?: string }) => {
    setIsLoading(true);

    try {
      // Verificar token
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!authToken) {
        throw new Error('Não há token de autenticação. Faça login novamente.');
      }

      let endpoint = '/api/users/profile';
      let method = 'PUT';

      // Se estiver atualizando senha, usar endpoint diferente
      if (userData.currentPassword && userData.newPassword) {
        endpoint = '/api/users/password';
        method = 'POST';
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar perfil');
      }

      const data = await response.json();
      
      // Extrair os dados do usuário atualizados
      const updatedUser = data.user || data.data?.user;
      
      if (!updatedUser) {
        throw new Error('Dados do usuário não recebidos');
      }
      
      // Atualizar estado do usuário
      setUser(prevUser => {
        return { ...prevUser, ...updatedUser } as User;
      });
      
      return updatedUser;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Adicionar a função updateUserProfile após updateUser
  const updateUserProfile = async (userData: Partial<User>) => {
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar perfil');
      }

      const data = await response.json();
      
      // Atualizar o usuário no contexto
      setUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, ...data.user };
      });

      console.log('Perfil atualizado com sucesso');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar customizações do perfil
  const updateCustomization = async (type: 'avatar' | 'banner', itemId: string) => {
    try {
      setIsLoading(true);
      
      // Verificar se o usuário está logado
      if (!user) {
        throw new Error('Você precisa estar logado para realizar esta ação');
      }
      
      // Verificar se itemId é válido
      if (!itemId) {
        throw new Error('ID do item não fornecido');
      }
      
      const response = await fetch('/api/users/customization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, itemId }),
      });
      
      if (!response.ok) {
        // Tentar obter a mensagem de erro da API
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erro ao atualizar ${type} (${response.status})`);
        } catch (jsonError) {
          // Se não conseguir processar o JSON, usar a mensagem do status
          throw new Error(`Erro ao atualizar ${type}: ${response.statusText || response.status}`);
        }
      }
      
      const data = await response.json();
      
      // Atualizar o usuário no contexto
      if (type === 'avatar') {
        setUser(prev => prev ? { ...prev, avatarId: itemId } : null);
      } else {
        setUser(prev => prev ? { ...prev, bannerId: itemId } : null);
      }
      
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar customização:', error);
      // Repassa o erro para ser tratado pelo componente chamador
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fazer upload de avatar personalizado
  const updateUserAvatar = async (file: File) => {
    try {
      console.log('Iniciando upload de avatar...', file.name, file.type, file.size);
      
      // Criar um FormData para enviar o arquivo
      const formData = new FormData();
      formData.append('avatar', file);

      // Enviar o arquivo para o servidor
      console.log('Enviando arquivo para /api/users/avatar...');
      const response = await fetch(`/api/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      // Verificar se a resposta é bem-sucedida
      console.log('Resposta recebida:', response.status, response.statusText);
      
      if (!response.ok) {
        // Tentar obter o corpo da resposta para diagnóstico
        let errorBody = '';
        try {
          const errorData = await response.text();
          errorBody = errorData;
          console.error('Corpo da resposta de erro:', errorData);
        } catch (readError) {
          console.error('Não foi possível ler o corpo da resposta:', readError);
        }
        
        throw new Error(`Erro HTTP: ${response.status} - ${errorBody}`);
      }

      try {
        // Tentar obter a resposta como JSON
        const data = await response.json();
        console.log('Dados da resposta:', data);
        
        // Atualizar o estado do usuário com o novo avatar
        if (data && data.avatarUrl) {
          setUser(prev => {
            if (!prev) return null;
            // Atualizar corretamente o campo avatarUrl, não avatar
            return { 
              ...prev, 
              avatarUrl: data.avatarUrl 
            };
          });
          console.log("Avatar atualizado com sucesso!");
        } else {
          // Se não tiver a URL do avatar, recarregar os dados do usuário
          await refreshUser();
          console.log("Dados do usuário atualizados após upload de avatar");
        }
      } catch (parseError) {
        // Se não for possível analisar como JSON, apenas recarregar os dados do usuário
        console.log("Resposta não é JSON, atualizando dados do usuário");
        await refreshUser();
      }
    } catch (error) {
      console.error("Erro ao atualizar avatar:", error);
      throw new Error("Falha no upload da imagem. Tente novamente.");
    }
  };

  // Função para realizar logout
  const logout = () => {
    clearAuthData();
    router.push('/login');
  };

  // Função para atualizar os dados do usuário
  const refreshUser = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se o usuário está autenticado
      if (!isAuthenticated) {
        throw new Error('Usuário não autenticado');
      }
      
      // Verificar se o token é válido
      if (!token) {
        throw new Error('Token inválido');
      }
      
      // Fazer uma requisição para a API para atualizar os dados do usuário
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar os dados do usuário');
      }
      
      const data = await response.json();
      
      // Verificar se a resposta contém os dados do usuário
      if (!data.user) {
        throw new Error('Dados do usuário não encontrados');
      }
      
      // Atualizar o estado do usuário
      setUser(data.user);
      
      console.log('Dados do usuário atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar os dados do usuário:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar o saldo do usuário localmente
  const updateUserBalance = (newBalance: number) => {
    if (user) {
      console.log(`Atualizando saldo do usuário de ${user.balance} para ${newBalance}`);
      
      // Salvar saldo no localStorage para persistência
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_balance', newBalance.toString());
        console.log('Saldo atualizado no localStorage:', newBalance);
      }
      
      setUser(prevUser => prevUser ? { ...prevUser, balance: newBalance } : null);
    } else {
      console.error('Tentativa de atualizar saldo sem usuário autenticado');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isSimulatedMode,
        login,
        register,
        logout,
        updateUser,
        updateUserProfile,
        updateCustomization,
        updateUserAvatar,
        refreshUser,
        updateUserBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para facilitar o acesso ao contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 