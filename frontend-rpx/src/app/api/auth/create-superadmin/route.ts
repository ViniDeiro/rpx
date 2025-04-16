import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getModels } from '@/lib/mongodb/models';
import { connectToDatabase } from '@/lib/mongodb/connect';

// Esta é uma rota secreta para criar o superadmin
// Deve ser usada apenas uma vez e depois removida ou desativada
export async function POST(request: Request) {
  try {
    // Verificar se há uma chave secreta para proteção adicional
    const { secretCode } = await request.json();
    const SETUP_SECRET = process.env.SETUP_SECRET || 'setup_rpx_superadmin_123';
    
    if (secretCode !== SETUP_SECRET) {
      console.log('Tentativa de criar superadmin com código secreto inválido');
      // Retornar 404 como se a rota não existisse para evitar ataques
      return new NextResponse(null, { status: 404 });
    }
    
    // Conectar ao banco de dados
    await connectToDatabase();
    const { User } = await getModels();
    
    // Verificar se já existe um superadmin
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      console.log('Superadmin já existe, operação cancelada');
      return NextResponse.json({ 
        message: 'Já existe um superadmin cadastrado',
        username: existingSuperAdmin.username
      }, { status: 400 });
    }
    
    // Criar o superadmin com as credenciais especificadas
    const hashedPassword = await bcrypt.hash('Vini200!', 10);
    
    const superAdmin = new User({
      username: 'master',
      email: 'vini_deiro@rpx.com',
      password: hashedPassword,
      role: 'superadmin',
      isHidden: true,
      isVerified: true,
      status: 'active',
      profile: {
        name: 'Administrador Master'
      },
      wallet: {
        balance: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await superAdmin.save();
    console.log('Superadmin criado com sucesso:', superAdmin.username);
    
    return NextResponse.json({
      message: 'Superadmin criado com sucesso',
      username: superAdmin.username
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar superadmin:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a criação do superadmin' },
      { status: 500 }
    );
  }
} 