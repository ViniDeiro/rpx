import { NextApiRequest, NextApiResponse } from 'next';

// Definindo os tipos com base no que esperamos do banco de dados
interface UserDB {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string | null;
  createdAt: Date;
  lastLogin: Date | null;
  wallet?: {
    balance: number;
  } | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Simulando dados do banco, já que não temos o Prisma configurado
    const usuarios: UserDB[] = [
      {
        id: 1,
        name: 'João Silva',
        email: 'joao.silva@email.com',
        role: 'USER',
        status: 'ATIVO',
        createdAt: new Date('2023-10-15'),
        lastLogin: new Date('2024-04-05'),
        wallet: { balance: 350.75 }
      },
      {
        id: 2,
        name: 'Maria Oliveira',
        email: 'maria.oliveira@email.com',
        role: 'USER',
        status: 'ATIVO',
        createdAt: new Date('2023-11-20'),
        lastLogin: new Date('2024-04-06'),
        wallet: { balance: 127.50 }
      },
      {
        id: 3,
        name: 'Admin Principal',
        email: 'admin@rpx.com',
        role: 'ADMIN',
        status: 'ATIVO',
        createdAt: new Date('2023-01-01'),
        lastLogin: new Date('2024-04-07'),
        wallet: null
      },
      {
        id: 4,
        name: 'Pedro Santos',
        email: 'pedro.santos@email.com',
        role: 'USER',
        status: 'BLOQUEADO',
        createdAt: new Date('2023-12-10'),
        lastLogin: new Date('2024-03-20'),
        wallet: { balance: 0 }
      },
      {
        id: 5,
        name: 'Ana Ferreira',
        email: 'ana.ferreira@email.com',
        role: 'USER',
        status: 'INATIVO',
        createdAt: new Date('2024-01-05'),
        lastLogin: new Date('2024-02-15'),
        wallet: { balance: 75.25 }
      },
      {
        id: 6,
        name: 'Carlos Mendes',
        email: 'carlos.mendes@email.com',
        role: 'USER',
        status: 'ATIVO',
        createdAt: new Date('2024-02-18'),
        lastLogin: new Date('2024-04-05'),
        wallet: { balance: 230.00 }
      },
      {
        id: 7,
        name: 'Moderador Sistema',
        email: 'moderador@rpx.com',
        role: 'ADMIN',
        status: 'ATIVO',
        createdAt: new Date('2023-05-12'),
        lastLogin: new Date('2024-04-06'),
        wallet: null
      },
      {
        id: 8,
        name: 'Lúcia Pereira',
        email: 'lucia.pereira@email.com',
        role: 'USER',
        status: 'ATIVO',
        createdAt: new Date('2024-03-01'),
        lastLogin: new Date('2024-04-07'),
        wallet: { balance: 500.50 }
      }
    ];

    // Formatar os dados para o formato esperado pela interface Usuario
    const formattedUsuarios = usuarios.map((user: UserDB) => ({
      id: user.id,
      nome: user.name || '',
      email: user.email,
      tipoUsuario: user.role === 'ADMIN' ? 'admin' : 'jogador',
      status: (user.status || 'ATIVO').toLowerCase() as 'ativo' | 'inativo' | 'bloqueado',
      dataCadastro: user.createdAt.toISOString().split('T')[0],
      ultimoLogin: user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : null,
      saldo: user.role !== 'ADMIN' ? user.wallet?.balance || 0 : undefined,
    }));

    res.status(200).json(formattedUsuarios);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários', error: (error as Error).message });
  }
} 