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

  // Inicializar token a partir do localStorage (apenas no cliente)
  useEffect(() => {
    // Verificar se estamos no navegador
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');
      setToken(storedToken);
    }
  }, []);

  // Verificar se o usuário está autenticado ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Pegar o token do localStorage
        let storedToken = null;
        if (typeof window !== 'undefined') {
          storedToken = localStorage.getItem('auth_token');
        }
        
        // Se não houver token, não está autenticado
        if (!storedToken) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Adicionar código para tentar renovar o token em caso de expiração iminente
        try {
          // Decodificar o token para verificar a expiração (sem verificar assinatura)
          const tokenParts = storedToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            
            if (payload.exp) {
              const expirationTime = payload.exp * 1000; // converter para milissegundos
              const currentTime = Date.now();
              const timeUntilExpiry = expirationTime - currentTime;
              
              // Se faltarem menos de 1 dia para expirar, tenta renovar o token
              if (timeUntilExpiry < 24 * 60 * 60 * 1000 && timeUntilExpiry > 0) {
                console.log('Token próximo da expiração, tentando renovar...');
                try {
                  const refreshResponse = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${storedToken}`
                    }
                  });
                  
                  if (refreshResponse.ok) {
                    const refreshData = await refreshResponse.json();
                    if (refreshData.token) {
                      // Atualizar o token em localStorage
                      localStorage.setItem('auth_token', refreshData.token);
                      storedToken = refreshData.token;
                      console.log('Token renovado com sucesso!');
                    }
                  }
                } catch (refreshError) {
                  console.warn('Erro ao renovar token:', refreshError);
                  // Continua com o token existente mesmo se a renovação falhar
                }
              }
            }
          }
        } catch (tokenDecodeError) {
          console.warn('Erro ao decodificar token:', tokenDecodeError);
          // Continua com verificação normal mesmo se falhar a decodificação
        }
        
        // Atualizar o estado do token
        setToken(storedToken);
        
        // Validar o token com a API
        try {
          // Alterando para usar a rota correta na API
          const response = await fetch('/api/users/profile', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (!response.ok) {
            console.error('Erro na resposta da API:', response.status);
            throw new Error('Token inválido ou erro ao obter perfil');
          }

          const data = await response.json();
          console.log('Resposta completa da API de perfil:', JSON.stringify(data, null, 2));
          
          // Ajuste para lidar com diferentes estruturas de resposta
          const userData = data.data?.user || data.user;
          
          if (userData) {
            console.log('Perfil carregado com sucesso:', userData.id);
            console.log('Dados do perfil:', JSON.stringify(userData, null, 2));
            
            // Verificar se existe um saldo salvo no localStorage para persistência
            if (typeof window !== 'undefined') {
              const savedBalance = localStorage.getItem('user_balance');
              if (savedBalance) {
                const parsedBalance = parseFloat(savedBalance);
                if (!isNaN(parsedBalance)) {
                  console.log(`Restaurando saldo do localStorage: ${parsedBalance}`);
                  userData.balance = parsedBalance;
                }
              }
            }
            
            // Pré-carregar a imagem do avatar para evitar problemas de carregamento
            if (userData.avatarUrl) {
              try {
                await preloadImage(userData.avatarUrl);
                console.log('Avatar pré-carregado com sucesso');
              } catch (error) {
                console.warn('Erro ao pré-carregar avatar:', error);
              }
            }
            
            setUser(userData);
            setIsAuthenticated(true);
            
            // Sincronizar com NextAuth - fazer login na sessão NextAuth também
            try {
              console.log('Tentando sincronizar com NextAuth...');
              const syncResponse = await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  userId: userData.id,
                  email: userData.email,
                  name: userData.name || userData.username,
                  image: userData.avatarUrl,
                  token: storedToken // Incluir token para autenticação completa
                }),
              });
              
              if (!syncResponse.ok) {
                console.warn('Não foi possível sincronizar com NextAuth, mas o login local funcionou');
                
                // Tentar forçar a sessão - estratégia de backup
                if (typeof window !== 'undefined') {
                  localStorage.setItem('next-auth.session-token', storedToken);
                  // Forçar recarregamento para atualizar a sessão
                  // window.location.reload();
                }
              } else {
                console.log('✅ Sincronização com NextAuth bem-sucedida');
              }
            } catch (error) {
              console.warn('Erro ao sincronizar com NextAuth:', error);
            }
          } else {
            console.error('Resposta não contém dados do usuário:', data);
            throw new Error('Dados do usuário não encontrados na resposta');
          }
        } catch (error) {
          console.error('Erro ao validar token:', error);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
          }
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        
        // Em caso de erro, limpar o estado
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        
        // Remover token inválido
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Função para realizar login
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Verificar campos obrigatórios
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios');
      }

      console.log('Iniciando processo de login para:', email);
      
      // Fazer a requisição para a API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      // Se a resposta não for OK, tentar obter a mensagem de erro da API
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || `Erro no login (${response.status})`;
        console.error('Resposta de erro da API:', errorMessage);
        throw new Error(errorMessage);
      }
      
      // Tentar processar a resposta
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Erro ao processar resposta JSON:', jsonError);
        throw new Error('Resposta inválida do servidor');
      }
      
      // Verificar se a resposta contém um token
      if (!data.token) {
        console.error('Resposta não contém token:', data);
        throw new Error('Resposta de login inválida: token não encontrado');
      }
      
      // Verificar se a resposta contém os dados do usuário
      if (!data.user) {
        console.error('Resposta não contém dados do usuário:', data);
        throw new Error('Resposta de login inválida: dados do usuário não encontrados');
      }
      
      // Verificar e logar os dados de rank recebidos
      if (data.user && data.user.rank) {
        console.log('Dados de rank recebidos:', data.user.rank);
      } else {
        console.warn('Dados de rank não encontrados na resposta de login');
      }

      // Armazenar token no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token);
      }
      
      // Definir token no estado
      setToken(data.token);
      
      // Pré-carregar a imagem do avatar para evitar problemas de carregamento
      if (data.user.avatarUrl) {
        try {
          await preloadImage(data.user.avatarUrl);
          console.log('Avatar pré-carregado com sucesso');
        } catch (error) {
          console.warn('Erro ao pré-carregar avatar:', error);
        }
      }
      
      // Definir o usuário e estado de autenticação
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Sincronizar com NextAuth
      try {
        const syncResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId: data.user.id,
            email: data.user.email,
            name: data.user.name || data.user.username,
            image: data.user.avatarUrl
          }),
        });
        
        if (!syncResponse.ok) {
          console.warn('Não foi possível sincronizar com NextAuth, mas o login local funcionou');
        }
      } catch (error) {
        console.warn('Erro ao sincronizar com NextAuth:', error);
        // Continuar mesmo se a sincronização falhar
      }
      
      console.log('Login realizado com sucesso para:', email);
      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Tratar erro para apresentar mensagem mais amigável
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no login';
      
      // Verificar tipos específicos de erro para mensagens mais claras
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('MongoServerSelection') || errorMessage.includes('connect')) {
        friendlyMessage = 'Erro de conexão com o banco de dados. Verifique sua conexão com a internet.';
      } else if (errorMessage.includes('credenciais') || errorMessage.includes('inválidas')) {
        friendlyMessage = 'Email ou senha incorretos. Por favor, tente novamente.';
      }
      
      return { 
        success: false, 
        error: friendlyMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const register = async (userData: any) => {
    setIsLoading(true);
    
    try {
      // Preparar dados para registro
      const registrationData = {
        ...userData,
        // Gerar um username se não for fornecido
        username: userData.username || (userData.name ? generateUsername(userData.name) : undefined),
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
      
      setToken(data.token);
      setUser(data.user);

      // Redirecionar para a página inicial após registro bem-sucedido
      router.push('/profile');
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
    console.log('Iniciando processo de logout');
    
    // Remover o token do localStorage
    if (typeof window !== 'undefined') {
      console.log('Removendo token do localStorage');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      
      // Remover quaisquer outros itens relacionados à autenticação
      localStorage.removeItem('userId');
      sessionStorage.removeItem('auth_token');
    }
    
    // Limpar o estado local
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    // Chamada à API para fazer logout no servidor
    try {
      console.log('Chamando API para logout no servidor');
      fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }).catch(error => {
        console.error('Erro na chamada da API de logout:', error);
      });
      
      // Fazer logout da sessão do NextAuth
      fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      }).catch(error => {
        console.error('Erro ao fazer signout no NextAuth:', error);
      });
    } catch (error) {
      console.error('Erro durante o processo de logout:', error);
    }
    
    console.log('Processo de logout concluído. Estado limpo.');
    
    // Forçar recarregamento da página para garantir que todas as sessões sejam limpas
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
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