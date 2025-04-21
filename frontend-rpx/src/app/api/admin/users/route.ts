import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId, Document, WithId } from 'mongodb';
import mongoose from 'mongoose';
import { GET as getCachedUsers } from '../set-users/route';

// Interface para o usuário da sessão
interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
  isAdmin?: boolean;
}

// Interface para o usuário na API/banco de dados
interface ApiUser {
  _id: ObjectId;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string;
  isAdmin?: boolean;
}

// Função para verificar se o usuário atual é um administrador
async function isAdmin(request: NextRequest) {
  // Em ambiente de desenvolvimento, sempre permitir acesso admin
  // ATENÇÃO: APENAS PARA DESENVOLVIMENTO
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ MODO DESENVOLVIMENTO: Admin ativado automaticamente');
    return true;
  }

  try {
    console.log('🔍 Obtendo sessão do usuário...');
    // Obter a sessão do usuário - mais rápido que consultar o banco
    const session = await getServerSession(authOptions);
    
    // Verificar se a sessão existe e se o usuário já está marcado como admin
    if (session?.user?.isAdmin === true) {
      console.log('✅ Usuário já confirmado como admin na sessão');
      return true;
    }
    
    if (!session || !session.user || !session.user.email) {
      console.log('⚠️ Sessão incompleta ou ausente');
      return false;
    }
    
    console.log(`✅ Sessão encontrada para: ${session.user.email}`);
    
    // Conectar ao banco de dados para verificação final
    console.log('🔄 Verificando no banco de dados...');
    const { db } = await connectToDatabase();
    
    // Consulta otimizada - buscar apenas os campos necessários
    const user = await db.collection('users').findOne(
      { email: session.user.email },
      { projection: { isAdmin: 1 } }
    );
    
    if (!user) {
      console.log('⚠️ Usuário não encontrado no banco');
      return false;
    }
    
    const isAdminUser = user.isAdmin === true;
    console.log(`${isAdminUser ? '✅' : '❌'} Status admin: ${isAdminUser}`);
    
    return isAdminUser;
  } catch (error) {
    console.error('❌ Erro na verificação de admin:', error);
    return false;
  }
}

/**
 * Lista todos os usuários ou recupera um usuário específico por ID
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📥 Recebendo requisição GET para /api/admin/users');
    
    // Obter ID do usuário da URL, se existir
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    // Verificar se o usuário atual é um administrador
    console.log('🔒 Verificando permissões de administrador para acesso à lista de usuários');
    const isAdminCheck = await isAdmin(request);
    
    if (!isAdminCheck) {
      console.log('⛔ Acesso negado: usuário não é administrador');
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
      // SOLUÇÃO: Método alternativo de consulta
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
        
        // FALLBACK: Tentar pegar do cache
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
        console.log(`Usuário ${idx+1}: ID=${user._id}, Email=${user.email || 'sem email'}`);
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
  } catch (error: any) {
    console.error('Erro ao obter usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Criar um novo usuário (para uso administrativo)
export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin(req)) {
      return NextResponse.json(
        { message: 'Não autorizado. Acesso apenas para administradores.' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Validar dados necessários
    if (!body.email || !body.username || !body.name) {
      return NextResponse.json(
        { message: 'Dados insuficientes. E-mail, nome de usuário e nome são obrigatórios.' },
        { status: 400 }
      );
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se já existe um usuário com o mesmo email ou username
    const existingUser = await db.collection('users').findOne({
      $or: [
        { email: body.email },
        { username: body.username }
      ]
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'E-mail ou nome de usuário já cadastrados.' },
        { status: 400 }
      );
    }
    
    // Criar novo usuário
    const novoUsuario = {
      ...body,
      isAdmin: body.isAdmin || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(novoUsuario);
    
    if (!result.insertedId) {
      return NextResponse.json(
        { message: 'Erro ao inserir usuário no banco de dados' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      id: result.insertedId.toString(),
      ...novoUsuario
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Atualiza um usuário existente
export async function PUT(request: NextRequest) {
  try {
    // Verificar se o usuário atual é um administrador
    const isAdminUser = await isAdmin(request);
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Não autorizado. Apenas administradores podem atualizar usuários.' },
        { status: 401 }
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
    let objectId: ObjectId;
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
    const updateFields: Record<string, any> = {};
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
      _id: updatedUser?._id.toString(),
    });
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um usuário
export async function DELETE(req: NextRequest) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin(req)) {
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
    
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 