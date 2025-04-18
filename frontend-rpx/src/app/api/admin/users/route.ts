import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId, Document, WithId } from 'mongodb';

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
async function isAdmin() {
  // Obter a sessão do usuário
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return false;
  }

  try {
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Buscar o usuário pelo email
    const user = await usersCollection.findOne({ email: session.user.email });
    
    // Verificar se o usuário existe e é administrador
    return !!user && user.isAdmin === true;
  } catch (error) {
    console.error('Erro ao verificar permissões de administrador:', error);
    return false;
  }
}

/**
 * Lista todos os usuários ou recupera um usuário específico por ID
 */
export async function GET(req: NextRequest) {
  // Verificar se o usuário é administrador
  if (!await isAdmin()) {
    return NextResponse.json(
      { error: 'Apenas administradores podem listar usuários' },
      { status: 403 }
    );
  }

  try {
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');
    
    // Verificar se um ID específico foi solicitado na URL
    const url = new URL(req.url);
    const userId = url.searchParams.get('id');

    if (userId) {
      // Validar se o ID é um ObjectId válido
      if (!ObjectId.isValid(userId)) {
        return NextResponse.json(
          { error: 'ID de usuário inválido' },
          { status: 400 }
        );
      }
      
      // Buscar um usuário específico pelo ID
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      
      if (!user) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }
      
      // Converter _id para string para retornar no JSON
      return NextResponse.json({
        ...user,
        _id: user._id.toString()
      });
    } else {
      // Buscar todos os usuários e ordenar por nome de usuário
      const users = await usersCollection.find({}).sort({ username: 1 }).toArray();
      
      // Converter _id para string em cada usuário
      const formattedUsers = users.map((user) => ({
        ...user,
        _id: user._id.toString()
      }));
      
      return NextResponse.json(formattedUsers);
    }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários do banco de dados' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo usuário (para uso administrativo)
export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário é admin
    if (!await isAdmin()) {
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
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
    return NextResponse.json(
      { message: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}

// Atualiza um usuário existente
export async function PUT(request: NextRequest) {
  try {
    // Verificar se o usuário atual é um administrador
    const isAdminUser = await isAdmin();
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
  } catch (error) {
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
      { message: 'Erro ao excluir usuário' },
      { status: 500 }
    );
  }
} 