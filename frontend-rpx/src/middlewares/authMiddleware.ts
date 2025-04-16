import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_dev_environment';

interface JwtPayload {
  id: string;
  [key: string]: any;
}

type AuthMiddlewareCallback = (
  req: NextRequest, 
  userId: string, 
  token: string
) => Promise<{ status: 'success' | 'error'; [key: string]: any }>;

export function authenticateMiddleware(callback: AuthMiddlewareCallback) {
  return async (req: NextRequest) => {
    try {
      // Obter o token da requisição
      const authHeader = req.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { 
          status: 'error', 
          error: 'Token de autenticação não fornecido ou inválido' 
        };
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verificar o token
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      
      if (!decoded || !decoded.id) {
        return { 
          status: 'error', 
          error: 'Token de autenticação inválido' 
        };
      }
      
      // Chamar o callback com o ID do usuário autenticado
      return await callback(req, decoded.id, token);
    } catch (error) {
      console.error('Erro na autenticação:', error);
      
      if (error instanceof jwt.JsonWebTokenError) {
        return { 
          status: 'error', 
          error: 'Token de autenticação inválido' 
        };
      } else if (error instanceof jwt.TokenExpiredError) {
        return { 
          status: 'error', 
          error: 'Token de autenticação expirado' 
        };
      }
      
      return { 
        status: 'error', 
        error: 'Erro interno de autenticação' 
      };
    }
  };
} 