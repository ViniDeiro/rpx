import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { verifyToken, generateUserResponse } from '@/lib/auth/jwt';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Só aceita método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  // Extrai o token do cabeçalho Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Token não fornecido ou formato inválido:', authHeader);
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token recebido (primeiros 15 caracteres):', token.substring(0, 15) + '...');

  try {
    // Verifica e decodifica o token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Token inválido ou mal formado');
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    // Informações do usuário encontrado no token
    console.log('ID de usuário no token:', decoded.id);
    console.log('Email de usuário no token:', decoded.email);

    // Conecta ao banco de dados
    const db = await connectToDatabase();
    if (!db) {
      console.error('Falha ao conectar ao banco de dados');
      return res.status(500).json({ message: 'Erro de conexão com o banco de dados' });
    }

    // Busca o usuário pelo ID no payload do token
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('Usuário não encontrado com ID:', decoded.id);
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    console.log('Usuário encontrado:', user.email);

    // Retorna os dados do usuário
    const userResponse = generateUserResponse(user);
    return res.status(200).json({
      user: userResponse,
    });
  } catch (error: any) {
    console.error('Erro detalhado ao validar token:', error);
    console.error('Mensagem de erro:', error.message);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro desconhecido'
    });
  }
} 