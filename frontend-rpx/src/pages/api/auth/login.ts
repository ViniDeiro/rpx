import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb/connect';
import User from '@/models/User';
import { generateToken, generateUserResponse } from '@/lib/auth/jwt';

/**
 * API de login - POST /api/auth/login
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Permite apenas método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método não permitido' });
  }

  try {
    // Verifica se o corpo da requisição existe
    if (!req.body) {
      console.error('Corpo da requisição vazio ou inválido');
      return res.status(400).json({
        success: false,
        message: 'Corpo da requisição inválido',
      });
    }

    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      console.error('Email ou senha não fornecidos:', { hasEmail: !!email, hasPassword: !!password });
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios',
      });
    }

    console.log('Tentativa de login para:', email);
    console.log('Conectando ao MongoDB...');

    try {
      // Conectar ao MongoDB
      await connectToDatabase();
      console.log('Conexão com MongoDB estabelecida');
    } catch (dbError) {
      console.error('Erro ao conectar ao MongoDB:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao conectar ao banco de dados',
      });
    }

    try {
      // Buscar usuário pelo email e incluir a senha (que normalmente é excluída nas consultas)
      const user = await User.findOne({ email }).select('+password');

      // Verificar se o usuário existe
      if (!user) {
        console.log('Usuário não encontrado:', email);
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
        });
      }

      console.log('Usuário encontrado, verificando senha...');

      // Verificar senha
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        console.log('Senha incorreta para:', email);
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
        });
      }

      console.log('Login bem-sucedido para:', email);

      // Gerar token JWT
      const token = generateToken(user);
      
      // Preparar resposta do usuário (excluindo dados sensíveis)
      const userData = generateUserResponse(user);

      // Responder com sucesso
      return res.status(200).json({
        success: true,
        data: {
          user: userData,
          token,
        },
      });
    } catch (queryError) {
      console.error('Erro ao buscar ou validar usuário:', queryError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar autenticação',
      });
    }
  } catch (error: any) {
    console.error('Erro no processo de login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
} 