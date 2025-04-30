import { request, NextResponse } from 'next/server';
import { getBackendUrl } from '@/utils/apiConfig';
import { verifyToken } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { getModels } from '@/lib/mongodb/models';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_dev_environment';

/**
 * Middleware para autenticação da API
 */
async function authMiddleware(req) {
  // Extrair token de autorização
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Token de autorização ausente ou inválido');
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 401 });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verificar o token JWT diretamente para garantir que temos o ID
    const decodedToken = jwt.verify(token, JWT_SECRET);
    console.log('Token decodificado:', decodedToken);
    
    // Verificar se temos userId ou id (aceitar ambos)
    if (!decodedToken || (!decodedToken.id && !decodedToken.userId)) {
      console.error('Token JWT inválido ou sem ID de usuário', decodedToken);
      return NextResponse.json(
        { error: 'Token inválido ou sem ID de usuário' },
        { status: 401 });
    }
    
    // Usar userId ou id, o que estiver disponível
    const userId = decodedToken.userId || decodedToken.id;
    console.log('ID do usuário extraído do token:', userId);
    
    // Criar um objeto de usuário normalizado
    const user = {
      ...decodedToken,
      id: userId  // Garantir que temos uma propriedade id para uso consistente
    };
    
    // Requisição autenticada com sucesso
    return {
      user,
      token
    };
  } catch (error) {
    console.error('Erro na autenticação JWT:', error);
    return NextResponse.json(
      { error: 'Falha na autenticação JWT' },
      { status: 401 });
  }
}

/**
 * POST - Upload de avatar
 */
export async function POST(req) {
  console.log('=== INICIANDO PROCESSAMENTO DE UPLOAD DE AVATAR ===');
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  console.log('Método:', req.method);
  
  // Autenticar a requisição
  const authResult = await authMiddleware(req);
  
  // Se authResult é uma resposta (erro), retorná-la
  if (authResult instanceof NextResponse) {
    console.error('Erro de autenticação:', authResult.status);
    return authResult;
  }
  
  // Usar a requisição autenticada
  const authenticatedReq = authResult;
  const userId = authenticatedReq.user.id; // Agora sempre teremos um id normalizado
  const token = authenticatedReq.token;
  
  if (!userId) {
    console.error('ID do usuário não encontrado no token decodificado');
    return NextResponse.json(
      { success: false, message: 'ID do usuário não encontrado' },
      { status: 400 });
  }
  
  console.log('Usuário autenticado, ID:', userId);
  
  try {
    // Verificar se a requisição contém um arquivo
    console.log('Tentando processar FormData...');
    
    // Processar o upload como multipart/form-data
    let formData;
    try {
      formData = await req.formData();
      console.log('FormData recebido com sucesso', formData.entries ? 'com entries' : 'sem entries');
      
      // Imprimir os campos disponíveis no FormData
      for (const [name, value] of formData.entries()) {
        console.log(`Campo FormData: ${name} (${typeof value})`, 
          value instanceof File ? `File: ${value.name}, ${value.type}, ${value.size} bytes` : 'Não é um arquivo');
      }
    } catch (formError) {
      console.error('Erro ao processar formData:', formError);
      return NextResponse.json(
        { success: false, message: 'Erro ao processar o FormData: ' + formError.message },
        { status: 400 });
    }
    
    const file = formData.get('avatar');
    console.log('Arquivo obtido:', file ? 'sim' : 'não');
    
    if (!file) {
      console.error('Arquivo de imagem não fornecido');
      return NextResponse.json(
        { success: false, message: 'Arquivo de imagem não fornecido' },
        { status: 400 });
    }
    
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      console.error('Formato de arquivo inválido:', file.type);
      return NextResponse.json(
        { success: false, message: 'Formato de arquivo inválido. Envie uma imagem válida.' },
        { status: 400 });
    }
    
    // Verificar o tamanho do arquivo (limitando para ~1.5MB)
    console.log('Tamanho da imagem:', Math.round(file.size / 1024), 'KB');
    
    if (file.size > 2000000) { // ~2MB
      console.error('Imagem muito grande:', Math.round(file.size / 1024), 'KB');
      return NextResponse.json(
        { success: false, message: 'A imagem é muito grande. O tamanho máximo é 2MB.' },
        { status: 400 });
    }
    
    // Converter para base64 para armazenamento no MongoDB
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    console.log('Processando imagem para armazenamento...');
    
    // Conectar ao MongoDB
    console.log('Conectando ao MongoDB para atualizar avatar...');
    await connectToDatabase();
    
    // Obter o modelo de usuário
    const { User } = await getModels();
    
    // Buscar e atualizar o usuário usando o modelo Mongoose
    console.log(`Buscando e atualizando usuário com ID: ${userId}`);
    
    // Verificar o tamanho do campo avatarUrl antes da atualização
    const userBeforeUpdate = await User.findById(userId);
    if (userBeforeUpdate) {
      console.log('Usuário encontrado antes da atualização');
      console.log('avatarUrl existente:', userBeforeUpdate.avatarUrl ? 'Presente' : 'Ausente');
    }
    
    // Atualizar o usuário
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $set: {
          avatarUrl: base64Image,
          updatedAt: new Date()
        } 
      },
      { new: true } // Retornar o documento atualizado
    );
    
    if (!updatedUser) {
      console.error('Usuário não encontrado no banco de dados, ID:', userId);
      
      // Tentar buscar por email como fallback
      if (authenticatedReq.user.email) {
        const userByEmail = await User.findOneAndUpdate(
          { email: authenticatedReq.user.email },
          { 
            $set: {
              avatarUrl: base64Image,
              updatedAt: new Date()
            } 
          },
          { new: true }
        );
        
        if (userByEmail) {
          console.log('Usuário encontrado pelo email, avatar atualizado.');
          return NextResponse.json({
            success: true,
            message: 'Avatar atualizado com sucesso (via email)',
            avatarUrl: userByEmail.avatarUrl,
            user: userByEmail
          });
        }
      }
      
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado' },
        { status: 404 });
    }
    
    console.log(`Avatar atualizado com sucesso para o usuário ${userId}`);
    console.log('avatarUrl após atualização:', updatedUser.avatarUrl ? 'Presente' : 'Ausente');
    console.log('Tamanho do avatarUrl após atualização:', updatedUser.avatarUrl ? Math.round(updatedUser.avatarUrl.length / 1024) + ' KB' : '0 KB');
    
    // Força a sincronização com a base de dados
    try {
      await updatedUser.save();
      console.log('Documento de usuário salvo explicitamente');
    } catch (saveError) {
      console.error('Erro ao salvar o documento:', saveError);
    }
    
    // Retornar uma resposta de sucesso
    return NextResponse.json({
      success: true,
      message: 'Avatar atualizado com sucesso',
      avatarUrl: updatedUser.avatarUrl,
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao processar o upload do avatar:', error);
    return NextResponse.json(
      { success: false, message: 'Ocorreu um erro ao processar o upload. Tente novamente mais tarde.' },
      { status: 500 });
  }
} 