import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/lib/mongodb/connect';
import mongoose from 'mongoose';

// Segredo para o JWT (idealmente deve vir de variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
  console.log('Requisição de perfil de usuário recebida');
  
  try {
    // Obter o header de autorização
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Requisição sem token de autorização válido');
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 400 });
    }

    // Extrair o token
    const token = authorization.split(' ')[1];
    
    try {
      // Verificar o token
      console.log('Verificando token JWT...');
      const decodedToken = jwt.verify(token, JWT_SECRET);
      console.log('Token verificado com sucesso');
      
      // Obter o ID do usuário do token
      const userId = decodedToken.userId || decodedToken.id;
      if (!userId) {
        console.error('ID do usuário não encontrado no token');
        return NextResponse.json(
          { error: 'ID do usuário não encontrado no token' },
          { status: 400 });
      }
      
      console.log(`Buscando perfil do usuário com ID: ${userId}`);
      
      // Conectar ao banco de dados
      await connectToDatabase();
      const db = mongoose.connection.db;
      
      if (!db) {
        console.error('Falha ao obter instância do banco de dados');
        return NextResponse.json(
          { error: 'Erro de conexão com o banco de dados' },
          { status: 500 });
      }
      
      // Buscar usuário pelo ID
      const user = await db.collection('users').findOne(
        { _id: new mongoose.Types.ObjectId(userId) }
      );
      
      if (!user) {
        console.log('Usuário não encontrado no banco de dados');
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 400 });
      }
      
      // Preparar dados formatados para retorno
      const userData = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        birthdate: user.birthdate,
        role: user.role,
        userNumber: user.userNumber || null,
        // Garantir que o avatarUrl seja incluído
        avatarUrl: user.avatarUrl || null,
        bio: user.bio || '',
        socialLinks: user.socialLinks || {},
        profile: user.profile || {},
        balance: user.wallet?.balance || 0,
        stats: user.stats || {},
        wallet: user.wallet || { balance: 0 },
        createdAt: user.createdAt
      };
      
      // Logar se o avatar existe
      if (user.avatarUrl) {
        console.log('Avatar encontrado para o usuário');
      } else {
        console.log('Usuário sem avatar configurado');
      }
      
      console.log('Perfil do usuário obtido com sucesso');
      return NextResponse.json(userData);
      
    } catch (tokenError) {
      console.error('Erro ao verificar token:', tokenError);
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 });
    }
  } catch (error) {
    console.error('Erro ao obter perfil do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 });
  }
}

// Implementação do método PUT para atualizar o perfil do usuário
export async function PUT(request) {
  console.log('Requisição de atualização de perfil recebida');
  
  try {
    // Obter o header de autorização
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Requisição sem token de autorização válido');
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 400 });
    }

    // Extrair o token
    const token = authorization.split(' ')[1];
    
    try {
      // Verificar o token
      console.log('Verificando token JWT...');
      const decodedToken = jwt.verify(token, JWT_SECRET);
      console.log('Token verificado com sucesso');
      
      // Obter os dados da requisição
      const userData = await request.json();
      console.log('Dados do usuário recebidos:', Object.keys(userData).join(', '));
      
      // Buscar usuário pelo ID diretamente usando a conexão do MongoDB
      const userId = decodedToken.userId || decodedToken.id;
      console.log(`Buscando usuário com ID: ${userId}`);
      
      try {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // Acessar a coleção users diretamente para atualizar o usuário
        const db = mongoose.connection.db;
        if (!db) {
          console.error('Falha ao obter instância do banco de dados');
          return NextResponse.json(
            { error: 'Erro de conexão com o banco de dados' },
            { status: 500 });
        }

        // Construir o objeto de atualização, removendo campos que não devem ser atualizados
        const updateData = {};
        
        // Lista de campos permitidos para atualização
        const allowedFields = ['username', 'email', 'phone', 'cpf', 'birthdate', 'bio'];
        
        for (const field of allowedFields) {
          if (userData[field] !== undefined) {
            updateData[field] = userData[field];
          }
        }
        
        // Tratamento especial para o campo profile
        if (userData.profile) {
          updateData.profile = userData.profile;
        }
        
        // Tratamento para redes sociais
        if (userData.socialLinks) {
          updateData.socialLinks = userData.socialLinks;
        }
        
        // Adicionar timestamp de atualização
        updateData.updatedAt = new Date();
        
        console.log('Dados a serem atualizados:', updateData);
        
        // Atualizar o usuário no banco de dados
        const result = await db.collection('users').updateOne(
          { _id: userObjectId },
          { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
          console.log('Usuário não encontrado no banco de dados');
          return NextResponse.json(
            { error: 'Usuário não encontrado' },
            { status: 404 });
        }
        
        if (result.modifiedCount === 0) {
          console.log('Nenhum dado foi alterado');
          return NextResponse.json(
            { message: 'Nenhum dado foi alterado' },
            { status: 200 });
        }
        
        // Buscar o usuário atualizado
        const updatedUser = await db.collection('users').findOne({ _id: userObjectId });
        
        if (!updatedUser) {
          console.log('Erro ao recuperar usuário atualizado');
          return NextResponse.json(
            { error: 'Erro ao recuperar usuário atualizado' },
            { status: 500 });
        }
        
        // Preparar dados do usuário para resposta
        const responseData = {
          id: updatedUser._id.toString(),
          username: updatedUser.username,
          email: updatedUser.email,
          phone: updatedUser.phone,
          cpf: updatedUser.cpf, 
          birthdate: updatedUser.birthdate,
          role: updatedUser.role,
          userNumber: updatedUser.userNumber || null,
          avatarUrl: updatedUser.avatarUrl || null,
          bio: updatedUser.bio || '',
          socialLinks: updatedUser.socialLinks || {},
          profile: updatedUser.profile || {},
          balance: updatedUser.wallet?.balance || 0,
          stats: updatedUser.stats || {},
          wallet: updatedUser.wallet || { balance: 0 },
          createdAt: updatedUser.createdAt
        };
        
        console.log('Perfil do usuário atualizado com sucesso');
        return NextResponse.json({
          message: 'Perfil do usuário atualizado com sucesso',
          user: responseData
        });
      } catch (e) {
        console.error('ID de usuário inválido:', e);
        return NextResponse.json(
          { error: 'ID de usuário inválido' },
          { status: 400 });
      }
    } catch (tokenError) {
      console.error('Erro ao verificar token:', tokenError);
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 });
    }
  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 });
  }
} 