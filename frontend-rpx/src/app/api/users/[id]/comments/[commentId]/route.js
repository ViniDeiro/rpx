import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';

// Segredo para o JWT (idealmente deve vir de variáveis de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Método DELETE para remover um comentário
export async function DELETE(request, { params }) {
  try {
    console.log(`Requisição para excluir comentário ${params.commentId}`);
    
    // Obter o header de autorização
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Requisição sem token de autorização válido');
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 });
    }

    // Extrair o token
    const token = authorization.split(' ')[1];
    
    try {
      // Verificar o token
      const decodedToken = jwt.verify(token, JWT_SECRET);
      const currentUserId = decodedToken.userId;
      
      // Conectar ao banco de dados
      await connectToDatabase();
      
      const db = mongoose.connection.db;
      if (!db) {
        console.error('Falha ao obter instância do banco de dados');
        return NextResponse.json(
          { error: 'Erro de conexão com o banco de dados' },
          { status: 500 });
      }
      
      // Validar o commentId
      let commentId;
      try {
        commentId = new mongoose.Types.ObjectId(params.commentId);
      } catch (e) {
        console.error('ID de comentário inválido:', e);
        return NextResponse.json(
          { error: 'ID de comentário inválido' },
          { status: 400 });
      }
      
      // Obter o comentário
      const comment = await db.collection('profilecomments').findOne({ _id: commentId });
      
      if (!comment) {
        return NextResponse.json(
          { error: 'Comentário não encontrado' },
          { status: 404 });
      }
      
      // Verificar se o usuário tem permissão para excluir o comentário
      // (Dono do perfil, autor do comentário ou admin)
      const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(currentUserId) });
      
      const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
      const isProfileOwner = comment.userId ? comment.userId.toString() : "" === currentUserId;
      const isCommentAuthor = comment.authorId ? comment.authorId.toString() : "" === currentUserId;
      
      if (!isAdmin && !isProfileOwner && !isCommentAuthor) {
        return NextResponse.json(
          { error: 'Sem permissão para excluir este comentário' },
          { status: 403 });
      }
      
      // Excluir o comentário
      await db.collection('profilecomments').deleteOne({ _id: commentId });
      
      return NextResponse.json({
        message: 'Comentário excluído com sucesso'
      });
      
    } catch (tokenError) {
      console.error('Erro ao verificar token:', tokenError);
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 });
    }
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 });
  }
}

// Método PATCH para ocultar/mostrar um comentário (moderação)
export async function PATCH(request, { params }) {
  try {
    console.log(`Requisição para moderar comentário ${params.commentId}`);
    
    // Obter o header de autorização
    const headersList = headers();
    const authorization = headersList.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('Requisição sem token de autorização válido');
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 });
    }

    // Extrair o token
    const token = authorization.split(' ')[1];
    
    try {
      // Verificar o token
      const decodedToken = jwt.verify(token, JWT_SECRET);
      const currentUserId = decodedToken.userId;
      
      // Conectar ao banco de dados
      await connectToDatabase();
      
      const db = mongoose.connection.db;
      if (!db) {
        console.error('Falha ao obter instância do banco de dados');
        return NextResponse.json(
          { error: 'Erro de conexão com o banco de dados' },
          { status: 500 });
      }
      
      // Validar o commentId
      let commentId;
      try {
        commentId = new mongoose.Types.ObjectId(params.commentId);
      } catch (e) {
        console.error('ID de comentário inválido:', e);
        return NextResponse.json(
          { error: 'ID de comentário inválido' },
          { status: 400 });
      }
      
      // Obter o comentário
      const comment = await db.collection('profilecomments').findOne({ _id: commentId });
      
      if (!comment) {
        return NextResponse.json(
          { error: 'Comentário não encontrado' },
          { status: 404 });
      }
      
      // Verificar se o usuário tem permissão para moderar o comentário
      // (Dono do perfil ou admin)
      const user = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(currentUserId) });
      
      const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
      const isProfileOwner = comment.userId ? comment.userId.toString() : "" === currentUserId;
      
      if (!isAdmin && !isProfileOwner) {
        return NextResponse.json(
          { error: 'Sem permissão para moderar este comentário' },
          { status: 403 });
      }
      
      const { isHidden } = await request.json();
      
      if (typeof isHidden !== 'boolean') {
        return NextResponse.json(
          { error: 'Parâmetro isHidden deve ser um booleano' },
          { status: 400 });
      }
      
      // Atualizar o status oculto do comentário
      await db.collection('profilecomments').updateOne(
        { _id: commentId },
        { 
          $set: {
            isHidden,
            moderatedAt: new Date(),
            moderatedBy: currentUserId
          }
        }
      );
      
      return NextResponse.json({
        message: `Comentário ${isHidden ? 'ocultado' : 'exibido'} com sucesso`
      });
      
    } catch (tokenError) {
      console.error('Erro ao verificar token:', tokenError);
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 });
    }
  } catch (error) {
    console.error('Erro ao moderar comentário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 });
  }
} 