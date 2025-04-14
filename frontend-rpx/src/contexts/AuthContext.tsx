'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Interface para o usuário que vem da API
type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
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
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSimulatedMode: boolean; // Mantido para compatibilidade, mas sempre será false
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateCustomization: (type: 'avatar' | 'banner', itemId: string) => Promise<void>;
  updateUserAvatar: (file: File) => Promise<void>; // Nova função para fazer upload de avatar
};

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
  const router = useRouter();

  // Verificar se o usuário está autenticado ao carregar a página
  useEffect(() => {
    const validateToken = async () => {
      try {
        // Verificar se existe um token no localStorage
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Validar o token com a API
        try {
          // Alterando para usar a rota correta na API
          const response = await fetch('/api/users/profile', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.error('Erro na resposta da API:', response.status);
            throw new Error('Token inválido ou erro ao obter perfil');
          }

          const data = await response.json();
          
          // Ajuste para lidar com diferentes estruturas de resposta
          const userData = data.data?.user || data.user;
          
          if (userData) {
            console.log('Perfil carregado com sucesso:', userData.id);
            setUser(userData);
          } else {
            console.error('Resposta não contém dados do usuário:', data);
            throw new Error('Dados do usuário não encontrados na resposta');
          }
        } catch (error) {
          console.error('Erro ao validar token:', error);
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    validateToken();
  }, []);

  // Função de login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Usando o proxy configurado no Next.js
      console.log('Enviando solicitação de login para: /api/auth/login');

      // Login usando o proxy do Next.js
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      // Verificar se a resposta não é OK
      if (!response.ok) {
        // Primeiro tentar obter o texto da resposta
        const responseText = await response.text();
        
        try {
          // Tentar analisar o texto como JSON
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || 'Erro ao fazer login');
        } catch (jsonError) {
          // Se não conseguir analisar como JSON, usar o texto da resposta
          console.error('Erro na resposta não-JSON:', responseText);
          throw new Error('Erro na comunicação com o servidor. Tente novamente mais tarde.');
        }
      }
      
      // Se a resposta for OK, tentamos analisar o JSON
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
        console.log('Resposta de login completa:', data);
      } catch (jsonError) {
        console.error('Erro ao analisar JSON da resposta:', jsonError, 'Texto recebido:', text);
        throw new Error('Erro ao processar resposta do servidor. Tente novamente mais tarde.');
      }
      
      // Verificar se o token existe na resposta (corrigir para usar a estrutura correta)
      let token = null;
      let userData = null;
      
      // Verificar diferentes estruturas possíveis
      if (data.data?.token) {
        token = data.data.token;
        userData = data.data.user;
        console.log('Token encontrado na estrutura data.data.token');
      } else if (data.token) {
        token = data.token;
        userData = data.user;
        console.log('Token encontrado na estrutura data.token');
      }
      
      // Se ainda não encontrou o token, verificar outras possibilidades
      if (!token) {
        console.error('Erro: Token não encontrado na resposta. Estrutura da resposta:', data);
        throw new Error('Token não recebido do servidor. Verifique os logs.');
      }
      
      // Armazenar token
      localStorage.setItem('auth_token', token);
      
      // Atualizar estado do usuário
      setUser(userData);
      
      console.log('Login bem-sucedido. Token armazenado e usuário atualizado:', userData?.id || 'ID não disponível');
      
      return userData;
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw new Error(error.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const register = async (userData: any) => {
    setIsLoading(true);
    
    try {
      // Adicionar um username aos dados de registro
      const userDataWithUsername = {
        ...userData,
        username: generateUsername(userData.name),
      };

      console.log('Tentando registrar com dados:', {
        ...userDataWithUsername,
        password: '[PROTEGIDO]'
      });

      // Usando o proxy configurado no Next.js
      console.log('Enviando solicitação para: /api/auth/register');

      // Registro usando o proxy do Next.js
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userDataWithUsername),
      });
      
      // Verificar se a resposta não é OK
      if (!response.ok) {
        // Primeiro tentar obter o texto da resposta
        const responseText = await response.text();
        
        try {
          // Tentar analisar o texto como JSON
          const errorData = JSON.parse(responseText);
          console.error('Erro na resposta da API de registro:', errorData);
          throw new Error(errorData.message || 'Erro ao registrar usuário');
        } catch (jsonError) {
          // Se não conseguir analisar como JSON, usar o texto da resposta
          console.error('Erro na resposta não-JSON do registro:', responseText);
          throw new Error('Erro na comunicação com o servidor de registro. Tente novamente mais tarde.');
        }
      }
      
      // Se a resposta for OK, tentamos analisar o JSON
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
        console.log('Usuário registrado com sucesso na API:', data.user?.id || data.data?.user?.id || 'ID não disponível');
      } catch (jsonError) {
        console.error('Erro ao analisar JSON da resposta de registro:', jsonError, 'Texto recebido:', text);
        throw new Error('Erro ao processar resposta do servidor de registro. Tente novamente mais tarde.');
      }
      
      // Verificar se o token existe na resposta
      if (!data.token && data.data?.token) {
        data.token = data.data.token;
      }
      
      if (!data.user && data.data?.user) {
        data.user = data.data.user;
      }
      
      // Armazenar token
      localStorage.setItem('auth_token', data.token);
      
      // Atualizar estado do usuário
      setUser(data.user);
    } catch (error: any) {
      console.error('Erro no registro:', error);
      throw new Error(error.message || 'Falha no registro. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar dados do usuário
  const updateUser = async (userData: Partial<User>) => {
    setIsLoading(true);
    
    try {
      // Atualização usando a API
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar perfil');
      }
      
      const data = await response.json();
      
      // Atualizar estado do usuário
      setUser(data.user);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      throw new Error(error.message || 'Falha ao atualizar perfil. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar customizações do perfil
  const updateCustomization = async (type: 'avatar' | 'banner', itemId: string) => {
    setIsLoading(true);
    
    try {
      // Atualização usando a API
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch('/api/users/customization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, itemId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Erro ao atualizar ${type}`);
      }
      
      const data = await response.json();
      
      // Atualizar estado do usuário
      setUser(data.user);
    } catch (error: any) {
      console.error(`Erro ao atualizar ${type}:`, error);
      throw new Error(error.message || `Falha ao atualizar ${type}. Tente novamente mais tarde.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para fazer upload de avatar personalizado
  const updateUserAvatar = async (file: File) => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Usuário não autenticado');
      }
      
      // Converter o arquivo para base64
      const base64Data = await convertFileToBase64(file);
      
      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

  // Função de logout
  const logout = () => {
    // Remover token do localStorage
    localStorage.removeItem('auth_token');
    
    // Limpar estado do usuário
    setUser(null);
    
    // Redirecionar para a página inicial
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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