import jwt from 'jsonwebtoken';
import { IUser } from '@/models/User';

// Chave secreta para assinar o token - deve ser armazenada em variáveis de ambiente
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'rpx-app-secret-key-muito-segura-2024';
// Tempo de expiração do token (30 dias para desenvolvimento)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

console.log('JWT configurado com chave secreta:', JWT_SECRET.substring(0, 3) + '***' + JWT_SECRET.substring(JWT_SECRET.length - 3));
console.log('JWT tempo de expiração:', JWT_EXPIRES_IN);

export interface TokenPayload {
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
}

/**
 * Gera um token JWT com os dados do usuário
 */
export function generateToken(user: any): string {
  // Verificar se o usuário tem _id ou id
  const userId = user._id ? 
    (typeof user._id === 'string' ? user._id : user._id.toString()) : 
    user.id;
  
  if (!userId) {
    console.error('Erro ao gerar token: usuário sem ID', user);
    throw new Error('Usuário sem ID válido');
  }

  const payload: TokenPayload = {
    id: userId,
    email: user.email,
    name: user.name,
    balance: user.balance || 0,
    createdAt: user.createdAt || new Date().toISOString(),
  };

  console.log('Gerando token para usuário:', userId);

  try {
    // @ts-ignore - A biblioteca jsonwebtoken tem problemas de tipagem com TypeScript
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    
    // Removendo a linha problemática com substring
    console.log('Token gerado com sucesso!');
    
    // TypeScript será mais feliz com essa asserção de tipo
    return token as string;
  } catch (error) {
    console.error('Erro ao assinar token JWT:', error);
    throw new Error('Falha ao gerar token de autenticação');
  }
}

/**
 * Verifica e decodifica um token JWT
 */
export function verifyToken(token: string): TokenPayload | null {
  if (!token) {
    console.error('Token JWT vazio ou indefinido');
    return null;
  }

  try {
    console.log('Verificando token JWT...', token.substring(0, 15) + '...');
    
    // Verificar se é um token de desenvolvimento (mock)
    if (token.startsWith('mock-token-')) {
      console.log('Detectado token de desenvolvimento. Usando dados simulados.');
      // Retornar dados simulados para desenvolvimento
      return {
        id: 'mock-user-id',
        email: 'usuario@exemplo.com',
        name: 'Usuário Simulado',
        balance: 0,
        createdAt: new Date().toISOString(),
      };
    }
    
    // @ts-ignore - ignorando erro de tipagem do jsonwebtoken
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    console.log('Token verificado com sucesso para usuário:', decoded.id);
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
}

/**
 * Gera objeto de usuário para o cliente (omite dados sensíveis)
 */
export function generateUserResponse(user: any) {
  // Verificar se o usuário tem _id ou id
  const userId = user._id ? 
    (typeof user._id === 'string' ? user._id : user._id.toString()) : 
    user.id || 'id-nao-encontrado';

  return {
    id: userId,
    name: user.name,
    email: user.email,
    username: user.username,
    balance: user.balance || 0,
    phone: user.phone || null,
    birthdate: user.birthdate || null,
    createdAt: user.createdAt || new Date().toISOString(),
  };
} 