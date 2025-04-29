import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getModels } from '@/lib/mongodb/models';

export async function GET() {
  try {
    await connectToDatabase();
    const { User } = await getModels();

    // Verificar se já existe algum usuário
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return NextResponse.json({
        message: 'Dados iniciais já existem no banco',
        existingUsers
      });
    }

    // Criar senha hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('senha123', salt);

    // Criar usuário administrador
    const adminUser = new User({
      username: 'admin',
      email: 'admin@rpx.com',
      password,
      role: 'admin',
      profile: {
        name: 'Administrador',
        avatar: 'default',
        bio: 'Administrador do sistema'
      },
      wallet: {
        balance,
      status: 'active'
    });

    // Criar usuário comum
    const regularUser = new User({
      username: 'usuario',
      email: 'usuario@rpx.com',
      password,
      role: 'user',
      profile: {
        name: 'Usuário Teste',
        avatar: 'default',
        bio: 'Usuário para testes'
      },
      wallet: {
        balance,
      status: 'active'
    });

    // Salvar usuários
    await adminUser.save();
    await regularUser.save();

    return NextResponse.json({
      message: 'Dados iniciais criados com sucesso',
      users
        { username.username, email: email },
        { username.username, email: email }
      ]
    });
  } catch (error) {
    console.error('Erro ao criar dados iniciais:', error);
    return NextResponse.json(
      { error: 'Erro ao criar dados iniciais' },
      { status: 400 });
  }
} 