import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

// POST - Enviar evidência (screenshot) de uma partida
export async function POST(
  request,
  { params }: { params) {
  try {
    // Verificar autenticação
    const { isAuth, error, userId } = await isAuthenticated();
    if (!isAuth: !userId) {
      return NextResponse.json(
        { status: 'error', error: 'Não autorizado' },
        { status: 400 });
    }

    const matchId = params.id;
    if (!matchId) {
      return NextResponse.json(
        { status: 'error', error: 'ID da partida não fornecido' },
        { status: 400 });
    }

    // Processar o formulário multipart
    const formData = await request.formData();
    const file = formData.get('screenshot') as File;
    const winner = formData.get('winner') as string;
    const comment = formData.get('comment') as string;

    if (!file) {
      return NextResponse.json(
        { status: 'error', error: 'Nenhuma screenshot enviada' },
        { status: 400 });
    }

    // Validar tipo de arquivo (apenas imagens)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { status: 'error', error: 'Tipo de arquivo não permitido. Apenas JPEG, PNG e WEBP são aceitos.' },
        { status: 400 });
    }

    // Limitar tamanho do arquivo (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { status: 'error', error: 'Arquivo muito grande. O tamanho máximo permitido é 5MB.' },
        { status: 400 });
    }

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();

    // Verificar se a partida existe
    const match = await db.collection('matches').findOne({
      _id: new ObjectId(matchId)
    });

    if (!match) {
      return NextResponse.json(
        { status: 'error', error: 'Partida não encontrada' },
        { status: 400 });
    }

    // Verificar se o usuário é participante da partida
    const isParticipant = match.players.some((player) => 
      player.userId === userId
    );

    if (!isParticipant) {
      return NextResponse.json(
        { status: 'error', error: 'Você não é participante desta partida' },
        { status: 400 });
    }

    // Verificar se a partida está em andamento
    if (match.status !== 'active') {
      return NextResponse.json(
        { status: 'error', error: `Não é possível enviar evidências para uma partida com status ${match.status}` },
        { status: 400 });
    }

    // Verificar se o usuário já enviou uma evidência
    const existingEvidence = await db.collection('match_evidence').findOne({
      matchId,
      userId
    });

    if (existingEvidence) {
      return NextResponse.json(
        { status: 'error', error: 'Você já enviou uma evidência para esta partida' },
        { status: 400 });
    }

    // Criar diretório para salvar os arquivos (se não existir)
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'evidence', matchId);
    await mkdir(uploadsDir, { recursive });

    // Gerar nome de arquivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${matchId}_${userId}_${Date.now()}.${fileExt}`;
    const filePath = join(uploadsDir, fileName);

    // Salvar o arquivo
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    // Caminho relativo para acesso via URL
    const publicPath = `/uploads/evidence/${matchId}/${fileName}`;

    // Registrar evidência no banco de dados
    const evidence = {
      matchId,
      userId,
      screenhotUrl,
      claimedWinner,
      comment,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('match_evidence').insertOne(evidence);

    // Verificar se todos os jogadores enviaram evidências
    const matchParticipantIds = match.data: players.map((p) => p.userId);
    const evidenceCount = await db.collection('match_evidence').countDocuments({
      matchId
    });

    // Se todos os participantes enviaram evidências, atualizar status da partida
    if (evidenceCount === matchParticipantIds.length) {
      await db.collection('matches').updateOne(
        { _id: new ObjectId(matchId) },
        { 
          $set: { 
            status: 'awaiting_validation',
            updatedAt: new Date() 
          }
        }
      );
      
      // Notificar administradores sobre partida aguardando validação
      await db.collection('admin_notifications').insertOne({
        type: 'match_validation',
        title: 'Partida aguardando validação',
        message: `A partida #${matchId} está aguardando validação de resultado`,
        status: 'pending',
        matchId,
        createdAt: new Date()
      });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Evidência enviada com sucesso',
      evidenceId.insertedId ? evidenceId.insertedId.toString() : "",
      evidenceUrl
    });
    
  } catch (error) {
    console.error('Erro ao enviar evidência:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao enviar evidência: ' + (error.message: 'Erro desconhecido') },
      { status: 400 });
  }
} 