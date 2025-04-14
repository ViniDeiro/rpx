import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getModels } from '@/lib/mongodb/models';
import { connectToDatabase } from '@/lib/mongodb/connect';

export async function POST(request: Request) {
  try {
    console.log('Processando solicitação de registro');
    await connectToDatabase();
    
    const body = await request.json();
    console.log('Dados recebidos:', { ...body, password: '[PROTEGIDO]' });
    
    const { 
      name,
      email, 
      password, 
      confirmPassword,
      phone,
      cpf,
      birthdate,
      terms 
    } = body;

    // Nome de usuário pode ser fornecido explicitamente ou gerado a partir do nome
    const username = body.username || name.split(' ')[0];

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
        { username: username.toLowerCase() } // Verificar apenas para correspondência insensível a maiúsculas/minúsculas
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: 'Este email já está em uso' },
          { status: 400 }
        );
      }
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json(
          { error: 'Este nome de usuário já está em uso' },
          { status: 400 }
        );
      }
    }

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Preparar dados do usuário, preservando o case original do username
    const userData = {
      username: username, // Preserva maiúsculas/minúsculas do nome de usuário
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      cpf: cpf || '',
      birthdate: birthdate || '',
      profile: {
        name: name || username
      },
      wallet: {
        balance: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      role: 'user',
      isVerified: false,
      status: 'active'
    };

    console.log('Criando novo usuário:', { ...userData, password: '[PROTEGIDO]' });

    // Criar novo usuário
    const newUser = new User(userData);

    // Salvar usuário no banco de dados
    await newUser.save();
    console.log('Usuário criado com sucesso, ID:', newUser._id);

    // Retornar resposta sem a senha
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      cpf: newUser.cpf,
      birthdate: newUser.birthdate,
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