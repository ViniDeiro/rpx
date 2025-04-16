import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Middleware para autenticação
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, error: 'Não autorizado', userId: null };
  }
  
  return { isAuth: true, error: null, userId: session.user.id };
}

// POST: Enviar resultado da partida
export async function POST(request: Request) {
  try {
    const { isAuth, error, userId } = await isAuthenticated();
    
    if (!isAuth || !userId) {
      return NextResponse.json({
        status: 'error',
        error
      }, { status: 401 });
    }
    
    // Utilizar FormData para receber a imagem
    const formData = await request.formData();
    const matchId = formData.get('matchId') as string;
    const resultImage = formData.get('resultImage') as File;
    const comment = formData.get('comment') as string;
    
    if (!matchId || !resultImage) {
      return NextResponse.json({
        status: 'error',
        error: 'ID da partida e imagem do resultado são obrigatórios'
      }, { status: 400 });
    }
    
    const { db } = await connectToDatabase();
    
    // Verificar se a partida existe
    const match = await db.collection('matches').findOne({
      _id: new ObjectId(matchId)
    });
    
    if (!match) {
      return NextResponse.json({
        status: 'error',
        error: 'Partida não encontrada'
      }, { status: 404 });
    }
    
    // Verificar se o usuário é um participante da partida
    let isParticipant = false;
    for (const team of match.teams) {
      if (team.members && Array.isArray(team.members)) {
        if (team.members.some((memberId: any) => 
          memberId.toString() === userId
        )) {
          isParticipant = true;
          break;
        }
      }
    }
    
    if (!isParticipant) {
      return NextResponse.json({
        status: 'error',
        error: 'Apenas participantes da partida podem enviar resultados'
      }, { status: 403 });
    }
    
    // Verificar se a partida está no estado correto
    if (match.status !== 'in_progress' && match.status !== 'ready') {
      return NextResponse.json({
        status: 'error',
        error: 'Esta partida não está no estado correto para envio de resultados'
      }, { status: 400 });
    }
    
    // Processar a imagem
    const imageArrayBuffer = await resultImage.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);
    
    // Em um caso real, você enviaria esta imagem para um serviço de armazenamento
    // como o AWS S3 e salvaria a URL no banco de dados.
    // Para simplificar, vamos supor que a imagem será armazenada localmente
    // ou por um serviço como Cloudinary, e que a URL será retornada.
    
    // URL fictícia para exemplo
    const imageUrl = `/uploads/match-results/${matchId}-${Date.now()}.png`;
    
    // Atualizar o status da partida para 'awaiting_validation'
    await db.collection('matches').updateOne(
      { _id: new ObjectId(matchId) },
      { 
        $set: { 
          status: 'awaiting_validation',
          resultSubmission: {
            submittedBy: new ObjectId(userId),
            submittedAt: new Date(),
            imageUrl,
            comment,
            validated: false,
            validatedBy: null,
            validatedAt: null,
            validationComment: null
          }
        } 
      }
    );
    
    // Notificar administradores
    // Em um sistema real, você enviaria notificações para os administradores
    // para validar o resultado.
    
    return NextResponse.json({
      status: 'success',
      message: 'Resultado enviado com sucesso e aguardando validação',
      matchId
    });
    
  } catch (error: any) {
    console.error('Erro ao enviar resultado da partida:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao enviar resultado da partida'
    }, { status: 500 });
  }
} 