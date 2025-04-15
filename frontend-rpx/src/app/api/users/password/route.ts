import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb/connect';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { getModels } from '@/lib/mongodb/models';

// Segredo para o JWT (idealmente deve vir de variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  console.log('Requisição de alteração de senha recebida');
  
  try {
    // Obter o header de autorização
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Requisição sem token de autorização válido');
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }

    // Extrair o token
    const token = authorization.split(' ')[1];
    
    try {
      // Verificar o token
      console.log('Verificando token JWT...');
      const decodedToken = jwt.verify(token, JWT_SECRET) as any;
      console.log('Token verificado com sucesso');
      
      // Obter os dados do body
      const requestData = await request.json();
      const { currentPassword, newPassword } = requestData;
      
      if (!currentPassword || !newPassword) {
        console.log('Senha atual ou nova senha não fornecida');
        return NextResponse.json(
          { error: 'Senha atual e nova senha são obrigatórias' },
          { status: 400 }
        );
      }
      
      // Conectar ao banco de dados
      console.log('Conectando ao MongoDB...');
      await connectToDatabase();
      console.log('Conexão com MongoDB estabelecida');
      
      // Buscar usuário pelo ID
      console.log(`Buscando usuário com ID: ${decodedToken.userId || decodedToken.id}`);
      let userId;
      try {
        userId = new mongoose.Types.ObjectId(decodedToken.userId || decodedToken.id);
      } catch (e) {
        console.error('ID de usuário inválido:', e);
        return NextResponse.json(
          { error: 'ID de usuário inválido' },
          { status: 400 }
        );
      }
      
      // Obter o modelo do usuário
      const { User } = await getModels();
      
      // Buscar o usuário incluindo o campo de senha (que normalmente é excluído)
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        console.log('Usuário não encontrado no banco de dados');
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }
      
      // Verificar se a senha atual está correta
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        console.log('Senha atual incorreta');
        return NextResponse.json(
          { error: 'Senha atual incorreta' },
          { status: 401 }
        );
      }
      
      // Gerar hash da nova senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Atualizar a senha no banco de dados
      user.password = hashedPassword;
      user.updatedAt = new Date();
      await user.save();
      
      console.log('Senha atualizada com sucesso');
      
      // Preparar dados do usuário para resposta (excluindo a senha)
      const userData = {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        birthdate: user.birthdate,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
        profile: user.profile || {},
        balance: user.wallet?.balance || 0,
        stats: user.stats || {},
        wallet: user.wallet || { balance: 0 },
        createdAt: user.createdAt
      };
      
      return NextResponse.json({
        message: 'Senha atualizada com sucesso',
        user: userData
      });
      
    } catch (tokenError) {
      console.error('Erro ao verificar token:', tokenError);
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição de alteração de senha' },
      { status: 500 }
    );
  }
} 