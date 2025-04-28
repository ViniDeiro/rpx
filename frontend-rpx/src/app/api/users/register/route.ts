import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getModels } from '@/lib/mongodb/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, username } = body;

    // Validação básica
    if (!name || !email || !password || !username) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    await connectToDatabase();
    const { User } = await getModels();

    // Verificar se já existe um usuário com este email ou username
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário ou email já cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Gerar número sequencial para o usuário
    const lastUser = await User.findOne().sort({ userNumber: -1 });
    const userNumber = lastUser?.userNumber ? lastUser.userNumber + 1 : 1000;

    // Criar novo usuário com rank 'unranked' por padrão
    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
      userNumber,
      avatarUrl: '/images/avatar-placeholder.svg',
      rank: {
        tier: 'unranked',
        division: null,
        points: 0
      },
      wallet: {
        balance: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Salvar usuário
    await newUser.save();

    // Retornar sucesso
    return NextResponse.json({
      message: 'Usuário registrado com sucesso',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        avatarUrl: newUser.avatarUrl,
        rank: newUser.rank
      }
    });
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar usuário', message: error.message },
      { status: 500 }
    );
  }
} 