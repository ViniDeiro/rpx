import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getModels } from '@/lib/mongodb/models';
import { connectToDatabase } from '@/lib/mongodb/connect';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    console.log('Processando solicitação de registro');
    const { db } = await connectToDatabase();
    
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
          { status: 409 }
        );
      }
      if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        return NextResponse.json(
          { error: 'Este nome de usuário já está em uso' },
          { status: 409 }
        );
      }
    }

    // Gerar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Obter um número sequencial para o usuário
    let userNumber = 1; // Valor padrão inicial

    try {
      // Usar findOneAndUpdate para garantir atomicidade da operação
      const counterResult = await db.collection('counters').findOneAndUpdate(
        { _id: 'userNumber' }, // Identificador do contador
        { $inc: { seq: 1 } },  // Incrementar o contador
        { 
          upsert: true,        // Criar se não existir
          returnDocument: 'after'  // Retornar o documento atualizado
        }
      );

      // Se o contador foi encontrado ou criado, usar o valor dele
      if (counterResult && counterResult.value) {
        userNumber = counterResult.value.seq;
      }
      
      console.log(`Atribuído número sequencial #${userNumber} para o novo usuário`);
    } catch (counterError) {
      console.error('Erro ao gerar número sequencial de usuário:', counterError);
      // Continua com o valor padrão 1 se houver erro
    }

    // Preparar dados do usuário, preservando o case original do username
    const userData = {
      username, // Preserva maiúsculas/minúsculas do nome de usuário
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      cpf: cpf || '',
      birthdate: birthdate || '',
      userNumber, // Adicionar o número sequencial
      profile: {},
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
    console.log('Usuário criado com sucesso, ID:', newUser._id, 'Número:', userNumber);

    // Retornar resposta sem a senha
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      phone: newUser.phone,
      cpf: newUser.cpf,
      birthdate: newUser.birthdate,
      userNumber: newUser.userNumber, // Incluir o número sequencial na resposta
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