import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { verifyToken, generateUserResponse } from '@/lib/auth/jwt';
import User from '@/models/User';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Só aceita método PUT
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  // Extrai o token do cabeçalho Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica e decodifica o token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    // Conecta ao banco de dados
    await connectToDatabase();

    // Busca o usuário pelo ID no payload do token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Campos que podem ser atualizados
    const allowedFields = ['name', 'phone', 'birthdate'];
    
    // Percorre e atualiza os campos permitidos
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // @ts-ignore - O campo existe no modelo User
        user[field] = req.body[field];
      }
    }

    // Salva as alterações
    await user.save();

    // Retorna os dados atualizados do usuário
    return res.status(200).json({
      user: generateUserResponse(user),
      message: 'Perfil atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
} 