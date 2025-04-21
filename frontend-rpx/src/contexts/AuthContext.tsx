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
  updateCustomization: (type: 'avatar' | 'banner', itemId: string) => Promise<void>;
  updateUserAvatar: (file: File) => Promise<void>; // Nova função para fazer upload de avatar
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
      // Fazer a requisição para a API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Credenciais inválidas');
      }
      
      const data = await response.json();
      
      // Salvar o token no localStorage e no estado
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        setToken(data.token);
        
        // Definir o usuário e estado de autenticação
        if (data.user) {
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
          
          return { success: true };
        }
      }
      
      throw new Error('Resposta de login inválida');
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido no login' 
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
    setIsLoading(true);
    
    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      if (!authToken) {
        throw new Error('Usuário não autenticado');
      }
      
      // Converter o arquivo para base64
      const base64Data = await convertFileToBase64(file);
      
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ imageData: base64Data }),
      });
      
      if (!response.ok) {
        let errorMessage = 'Erro ao fazer upload da imagem';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Se não conseguir parsear o JSON, usa a mensagem padrão
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Atualizar o estado do usuário com a nova URL do avatar
      if (data.user) {
        setUser(data.user);
      } else if (data.avatarUrl) {
        // Se a API só retornar a URL do avatar, atualizamos apenas este campo
        setUser(prevUser => prevUser ? {...prevUser, avatarUrl: data.avatarUrl} : null);
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload do avatar:', error);
      throw new Error(error.message || 'Falha ao fazer upload da imagem. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para converter File para base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isSimulatedMode: false, // Sempre retorna false
        login,
        register,
        logout,
        updateUser,
        updateCustomization,
        updateUserAvatar,
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