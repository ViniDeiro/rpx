import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';

// Segredo para o JWT (idealmente deve vir de variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Método GET para obter os comentários de um usuário
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Requisição para obter comentários do usuário: ${params.id}`);
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    const db = mongoose.connection.db;
    if (!db) {
      console.error('Falha ao obter instância do banco de dados');
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Validar o ID do usuário
    let userId;
    try {
      userId = new mongoose.Types.ObjectId(params.id);
    } catch (e) {
      console.error('ID de usuário inválido:', e);
      return NextResponse.json(
        { error: 'ID de usuário inválido' },
        { status: 400 }
      );
    }
    
    // Buscar comentários
    const comments = await db.collection('profilecomments')
      .find({ 
        userId: userId,
        isHidden: { $ne: true   } 
      })
      .sort({ createdAt: -1 }) // Ordenar por data decrescente
      .toArray();
    
    return NextResponse.json({
      message: 'Comentários obtidos com sucesso',
      comments: comments
    });
  } catch (error) {
    console.error('Erro ao obter comentários:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
}

// Método POST para adicionar um comentário
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`Requisição para adicionar comentário ao usuário: ${params.id}`);
    
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
      const decodedToken = jwt.verify(token, JWT_SECRET) as any;
      
      // Conectar ao banco de dados
      await connectToDatabase();
      
      const db = mongoose.connection.db;
      if (!db) {
        console.error('Falha ao obter instância do banco de dados');
        return NextResponse.json(
          { error: 'Erro de conexão com o banco de dados' },
          { status: 500 }
        );
      }
      
      // Validar o ID do perfil alvo
      let targetUserId;
      try {
        targetUserId = new mongoose.Types.ObjectId(params.id);
      } catch (e) {
        console.error('ID de usuário inválido:', e);
        return NextResponse.json(
          { error: 'ID de usuário inválido' },
          { status: 400 }
        );
      }
      
      // Validar ID do autor do comentário
      let authorId;
      try {
        authorId = new mongoose.Types.ObjectId(decodedToken.userId);
      } catch (e) {
        console.error('ID de autor inválido:', e);
        return NextResponse.json(
          { error: 'ID de autor inválido' },
          { status: 400 }
        );
      }
      
      // Buscar informações do autor
      const author = await db.collection('users').findOne({ _id: authorId });
      if (!author) {
        return NextResponse.json(
          { error: 'Autor não encontrado' },
          { status: 404 }
        );
      }
      
      // Obter dados do comentário
      const { content } = await request.json();
      
      if (!content || content.trim() === '') {
        return NextResponse.json(
          { error: 'Conteúdo do comentário não pode estar vazio' },
          { status: 400 }
        );
      }
      
      if (content.length > 500) {
        return NextResponse.json(
          { error: 'Comentário não pode ter mais de 500 caracteres' },
          { status: 400 }
        );
      }
      
      // Criar o comentário
      const newComment = {
        userId: targetUserId,
        authorId: authorId,
        authorName: author.username || 'Usuário',
        authorAvatar: author.avatarUrl || null,
        content: content.trim(),
        isHidden: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('profilecomments').insertOne(newComment);
      
      return NextResponse.json({
        message: 'Comentário adicionado com sucesso',
        comment: {
          ...newComment,
          _id: result.insertedId
        }
      });
      
    } catch (tokenError) {
      console.error('Erro ao verificar token:', tokenError);
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 