import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb/connect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

/**
 * Endpoint para popular o banco de dados com dados iniciais (apenas para desenvolvimento)
 * 
 * ATENÇÃO: Este endpoint deve ser removido ou protegido em ambiente de produção!
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Só aceita método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Conecta ao banco de dados
    await connectToDatabase();
    
    // Verifica se já existem usuários no banco
    const count = await User.countDocuments();
    if (count > 0 && !req.query.force) {
      return res.status(409).json({ 
        message: 'O banco de dados já possui dados. Use ?force=true para forçar a operação.',
        count
      });
    }
    
    // Remove todos os usuários (se force=true)
    if (req.query.force) {
      await User.deleteMany({});
    }

    // Cria o usuário de demonstração
    const demoUser = await User.create({
      name: 'Usuário Demo',
      email: 'demo@rpx.com',
      password: 'senha123', // Será hasheada pelo middleware do modelo
      balance: 2500,
      createdAt: new Date(),
    });

    // Cria outros usuários de exemplo
    const users = await User.insertMany([
      {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        password: await bcrypt.hash('senha123', 10),
        balance: 1200,
        phone: '(11) 98765-4321',
        birthdate: new Date('1990-05-15'),
      },
      {
        name: 'Maria Souza',
        email: 'maria@exemplo.com',
        password: await bcrypt.hash('senha123', 10),
        balance: 3800,
        phone: '(21) 98765-4321',
        birthdate: new Date('1992-03-20'),
      },
    ]);

    return res.status(200).json({
      message: 'Banco de dados populado com sucesso!',
      data: {
        demoUser: {
          id: demoUser._id,
          email: demoUser.email,
          // Inclui a senha desencriptada apenas para facilitar o teste
          password: 'senha123',
        },
        usersCreated: users.length + 1,
      },
    });
  } catch (error: any) {
    console.error('Erro ao popular banco de dados:', error);
    return res.status(500).json({ 
      message: 'Erro ao popular banco de dados', 
      error: error.message
    });
  }
} 