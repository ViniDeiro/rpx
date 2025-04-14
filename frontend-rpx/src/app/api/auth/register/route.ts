import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getModels } from '@/lib/mongodb/models';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, confirmPassword } = body;

    // Validar dados de entrada
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'As senhas não coincidem' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar senha
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Obter modelos do MongoDB
    const { User } = await getModels();

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Este email já está em uso' },
          { status: 400 }
        );
      }
      if (existingUser.username === username.toLowerCase()) {
        return NextResponse.json(
          { error: 'Este nome de usuário já está em uso' },
          { status: 400 }
        );
      }
    }

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar novo usuário
    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      profile: {
        name: username
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Salvar usuário no banco de dados
    await newUser.save();

    // Retornar resposta sem a senha
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      profile: newUser.profile,
      createdAt: newUser.createdAt
    };

    return NextResponse.json({
      message: 'Usuário registrado com sucesso',
      user: userResponse
    }, { status: 201 });
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o registro' },
      { status: 500 }
    );
  }
} 