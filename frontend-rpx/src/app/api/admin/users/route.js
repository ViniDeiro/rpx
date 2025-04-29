import { request, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId, Document, WithId } from 'mongodb';
import mongoose from 'mongoose';
import { GET as getCachedUsers } from '../set-users/route';

// Interface para o usuário da sessão


// Interface para o usuário na API/banco de dados


// Função para verificar se o usuário atual é um administrador
async function isAdmin() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificação básica de sessão
    if (!session || !session.user || !session.user.email) {
      return false;
    }
    
    const { db } = await connectToDatabase();
    
    // Consulta otimizada - buscar apenas os campos necessários
    const user = await db.collection('users').findOne(
      { email: session.user.email },
      { projection: { isAdmin: 1 } }
    );
    
    if (!user) {
      return false;
    }
    
    return user.isAdmin === true;
  } catch (error) {
    console.error('Erro ao verificar administrador:', error);
    return false;
  }
}

/**
 * Lista todos os usuários ou recupera um usuário específico por ID
 */
export async function GET(request) {
  try {
    console.log('📥 Recebendo requisição GET para /api/admin/users');
    
    // Verificar se é administrador
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Não autorizado. Acesso restrito a administradores.' },
        { status: 403 }
      );
    }
    
    // Obter ID do usuário da URL, se existir
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // Verificar se o usuário atual é um administrador
    console.log('🔒 Verificando permissões de administrador para acesso à lista de usuários');
    const isAdminCheck = await isAdmin();
    
    if (!isAdminCheck) {
      console.log('⛔ Acesso negadoário não é administrador');
      // Retornar resposta mais detalhada para debugging
      return NextResponse.json(
        { 
          error: 'Não autorizado. Acesso somente para administradores.',
          message: 'Verifique se sua conta possui permissões de administrador.',
          timestamp: new Date().toISOString()
        },
        { 
          status: 403,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }
    
    console.log('✅ Usuário autenticado como administrador. Prosseguindo com a busca de usuários.');
    
    // Conectar ao banco de dados
    console.log('🔄 Conectando ao banco de dados');
    let { db } = await connectToDatabase();
    console.log('✅ Conectado ao banco de dados com sucesso');
    
    // Se um ID específico for fornecido, buscar apenas esse usuário
    if (id) {
      console.log(`🔍 Buscando usuário específico com ID: ${id}`);
      
      // Validar se o ID é válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log(`⚠️ ID inválido fornecido: ${id}`);
        return NextResponse.json(
          { error: 'ID de usuário inválido' },
          { status: 400 }
        );
      }
      
      const user = await db.collection('users').findOne(
        { _id: new mongoose.Types.ObjectId(id) }
      );
      
      if (!user) {
        console.log(`⚠️ Usuário com ID ${id} não encontrado`);
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }
      
      console.log(`✅ Usuário com ID ${id} encontrado e retornado`);
      
      // Definir cabeçalhos para prevenir problemas de cache
      return NextResponse.json(
        user,
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }
    
    // Buscar todos os usuários
    console.log('🔍 Buscando todos os usuários');
    try {
      // SOLUÇÃOétodo alternativo de consulta
      console.log('Tentando método alternativo de consulta...');
      
      // Verificar as coleções disponíveis para garantir
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log('Coleções disponíveis:', collectionNames);
      
      // Verificar quantos usuários existem no banco
      const countUsers = await db.collection('users').countDocuments();
      console.log(`Total no banco: ${countUsers} usuários`);
      
      // Consulta direta com cursor para maior compatibilidade
      const cursor = db.collection('users').find();
      const users = await cursor.toArray();
      
      // Verificar se temos usuários
      if (!users || users.length === 0) {
        console.log('⚠️ Nenhum usuário encontrado na consulta direta. Tentando fallback...');
        
        // FALLBACK pegar do cache
        const cachedResponse = await getCachedUsers(request);
        
        if (cachedResponse.status === 200) {
          const cachedData = await cachedResponse.json();
          
          if (Array.isArray(cachedData) && cachedData.length > 0) {
            console.log(`✅ Encontrados ${cachedData.length} usuários no cache. Usando esses.`);
            return NextResponse.json(
              cachedData,
              { 
                status: 200,
                headers: {
                  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                }
              }
            );
          }
        }
      }
      
      // Registrar cada usuário obtido
      users.forEach((user, idx) => {
        console.log(`Usuário ${idx+1}=${user._id}, Email=${user.email || 'sem email'}`);
      });
      
      const count = users.length;
      console.log(`✅ ${count} usuários encontrados e retornados`);
      
      // Retornar os usuários encontrados como array
      return NextResponse.json(
        users,
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    } catch (dbError) {
      console.error('❌ Erro ao buscar usuários do banco:', dbError);
      throw dbError; // Propagar erro para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error('Erro ao obter usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Criar um novo usuário (para uso administrativo)
export async function POST(request) {
  try {
    // Verificar se é administrador
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Não autorizado. Acesso restrito a administradores.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Validar dados obrigatórios
    if (!body.email || !body.username) {
      return NextResponse.json(
        { error: 'Dados incompletos. E-mail e nome de usuário são obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Verificar se o e-mail já está em uso
    const existingEmail = await db.collection('users').findOne({ email: body.email });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'E-mail já cadastrado.' },
        { status: 409 }
      );
    }
    
    // Verificar se o nome de usuário já está em uso
    const existingUsername = await db.collection('users').findOne({ username: body.username });
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Nome de usuário já em uso.' },
        { status: 409 }
      );
    }
    
    // Preparar objeto de usuário
    const newUser = {
      email: body.email,
      username: body.username,
      name: body.name || body.username,
      isAdmin: body.isAdmin === true,
      isActive: body.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
      balance: body.balance || 0,
      stats: {
        wins: 0,
        losses: 0,
        matches: 0,
        ...body.stats
      },
      currentRank: 'Novato',
      rankingPoints: 0,
      createdBy: 'admin'
    };
    
    // Inserir usuário
    const result = await db.collection('users').insertOne(newUser);
    
    // Registrar ação do admin
    await db.collection('admin_logs').insertOne({
      action: 'create_user',
      adminId: (await getServerSession(authOptions)).user.id,
      details: {
        userId: result.insertedId.toString(),
        email: body.email,
        username: body.username,
        isAdmin: body.isAdmin === true
      },
      timestamp: new Date()
    });
    
    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      userId: result.insertedId.toString()
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário', details: error.message },
      { status: 500 }
    );
  }
}

// Atualiza um usuário existente
export async function PUT(request) {
  try {
    // Verificar se o usuário atual é um administrador
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas administradores podem atualizar usuários.' },
        { status: 403 }
      );
    }

    // Obter os dados do corpo da requisição
    const data = await request.json();
    const { id, ...fields } = data;

    // Verificar se o ID foi fornecido
    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se pelo menos um campo para atualização foi fornecido
    if (Object.keys(fields).length === 0) {
      return NextResponse.json(
        { error: 'Pelo menos um campo deve ser fornecido para atualização' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    const collection = db.collection('users');

    // Verificar se o ID é válido
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return NextResponse.json(
        { error: 'ID de usuário inválido' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const existingUser = await collection.findOne({ _id: objectId });
    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Criar objeto com os campos a serem atualizados
    const updateFields = {};
    for (const key in fields) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        updateFields[key] = fields[key];
      }
    }

    // Se estiver tornando este usuário admin exclusivo, revogar admin de outros usuários
    if (updateFields.isAdmin && updateFields.isExclusiveAdmin) {
      await collection.updateMany(
        { _id: { $ne: objectId } },
        { $set: { isAdmin: false } }
      );
    }

    // Atualizar o usuário
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar o usuário atualizado
    const updatedUser = await collection.findOne({ _id: objectId });

    // Retornar o usuário atualizado
    return NextResponse.json({
      ...updatedUser,
      id: updatedUser._id.toString(),
      _id: undefined
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um usuário
export async function DELETE(req) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { message: 'ID do usuário não fornecido' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se o usuário existe
    const user = await db.collection('users').findOne({
      _id: new ObjectId(id)
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir usuário
    await db.collection('users').deleteOne({
      _id: new ObjectId(id)
    });
    
    return NextResponse.json(
      { message: 'Usuário excluído com sucesso' }
    );
    
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 