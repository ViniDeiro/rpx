import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './index';

// Define o tipo de retorno da função de verificação
interface AuthResult {
  isAuthenticated: boolean;
  userId: string | null;
  username: string | null;
  error?: string;
}

// Segredo para o JWT (idealmente deve vir de variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'rpx-app-secret-key-muito-segura-2024';

/**
 * Verifica a autenticação do usuário a partir do token JWT
 * @param request Objeto de requisição Next.js
 * @returns Objeto com resultado da autenticação
 */
export async function verifyAuth(request: Request): Promise<AuthResult> {
  try {
    // Obter o token do cookie de autenticação
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    // Se não houver token, verificar se está no header Authorization
    let authHeader = null;
    if (!token && request.headers) {
      authHeader = request.headers.get('Authorization');
    }
    
    // Se não houver token nem no cookie nem no header, o usuário não está autenticado
    if (!token && !authHeader) {
      return {
        isAuthenticated: false,
        userId: null,
        username: null,
        error: 'Token não fornecido'
      };
    }
    
    // Usar o token do header se disponível, senão usar o do cookie
    const finalToken = authHeader?.replace('Bearer ', '') || token;
    
    if (!finalToken) {
      return {
        isAuthenticated: false,
        userId: null,
        username: null,
        error: 'Token inválido'
      };
    }
    
    // Verificar e decodificar o token
    const decoded: any = jwt.verify(finalToken, JWT_SECRET);
    
    if (!decoded || (!decoded.userId && !decoded.id)) {
      return {
        isAuthenticated: false,
        userId: null,
        username: null,
        error: 'Token inválido ou expirado'
      };
    }
    
    // Uso userId ou id, dependendo de qual estiver disponível
    const userId = decoded.userId || decoded.id;
    
    // Retornar resultado bem-sucedido
    return {
      isAuthenticated: true,
      userId: userId,
      username: decoded.username || null
    };
    
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return {
      isAuthenticated: false,
      userId: null,
      username: null,
      error: 'Erro na verificação do token'
    };
  }
}

/**
 * Função para autenticação unificada nas rotas de API
 * Tenta autenticar tanto por NextAuth quanto por JWT
 */
export async function isAuthenticated() {
  try {
    // Primeiro, tenta autenticar via NextAuth
    const session = await getServerSession(authOptions);
    
    if (session && session.user && session.user.id) {
      return { 
        isAuth: true, 
        error: null, 
        userId: session.user.id,
        username: session.user.username || session.user.name
      };
    }
    
    // Se não conseguir via NextAuth, verifica JWT em cookies
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return { 
        isAuth: false, 
        error: 'Não autorizado', 
        userId: null 
      };
    }
    
    try {
      // Verificar e decodificar o token
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      if (!decoded || (!decoded.userId && !decoded.id)) {
        return { 
          isAuth: false, 
          error: 'Token inválido ou expirado', 
          userId: null 
        };
      }
      
      // Uso userId ou id, dependendo de qual estiver disponível
      const userId = decoded.userId || decoded.id;
      
      return { 
        isAuth: true, 
        error: null, 
        userId: userId 
      };
    } catch (error) {
      console.error('Erro ao verificar token JWT:', error);
      return { 
        isAuth: false, 
        error: 'Erro na verificação do token', 
        userId: null 
      };
    }
  } catch (error) {
    console.error('Erro no processo de autenticação:', error);
    return { 
      isAuth: false, 
      error: 'Falha no processo de autenticação', 
      userId: null 
    };
  }
} 