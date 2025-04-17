import { ObjectId } from 'mongodb';

// Interface para simular a resposta do nextjs
interface ResponseInit {
  status?: number;
  headers?: Record<string, string>;
}

// Função auxiliar para criar respostas JSON
function jsonResponse(data: any, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

// POST /api/matches/[id]/confirm - Confirmar entrada do jogador na partida
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Extrair o token de autorização
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Token de autenticação não fornecido' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar o token e extrair o ID do usuário
    // Aqui estamos simulando a verificação do token - numa implementação real
    // você decodificaria o JWT e verificaria sua validade
    const userId = "user_id_extraido_do_token"; // Substitua por lógica real de extração
    
    const { id } = params;
    
    // Validar ID da partida
    if (!id || !ObjectId.isValid(id)) {
      return jsonResponse({ error: 'ID da partida inválido' }, { status: 400 });
    }
    
    // Conectar ao banco de dados - usando require para evitar erros de tipo
    const { connectToDatabase } = require('../../../../lib/mongodb/connect');
    const { db } = await connectToDatabase();
    
    // Verificar se a partida existe e se o usuário está nela
    const match = await db.collection('matches').findOne({
      _id: new ObjectId(id),
      players: userId
    });
    
    if (!match) {
      return jsonResponse(
        { error: 'Partida não encontrada ou você não está participando dela' },
        { status: 404 }
      );
    }
    
    // Verificar se o tempo para confirmar não expirou (2 minutos após criação)
    const createdAt = new Date(match.createdAt);
    const now = new Date();
    const timeDiff = (now.getTime() - createdAt.getTime()) / 1000; // em segundos
    
    if (timeDiff > 120) { // 2 minutos
      return jsonResponse(
        { error: 'Tempo para confirmar expirou' },
        { status: 400 }
      );
    }
    
    // Verificar se o jogador já confirmou
    if (match.confirmedPlayers && match.confirmedPlayers.includes(userId)) {
      return jsonResponse(
        { success: true, message: 'Você já confirmou sua entrada' }
      );
    }
    
    // Atualizar a partida com a confirmação do jogador
    const result = await db.collection('matches').updateOne(
      { _id: new ObjectId(id) },
      { 
        $addToSet: { confirmedPlayers: userId },
        $set: { updatedAt: new Date() }
      }
    );
    
    if (result.modifiedCount === 0) {
      return jsonResponse(
        { error: 'Não foi possível confirmar sua entrada' },
        { status: 500 }
      );
    }
    
    // Verificar se todos confirmaram para atualizar o status da partida
    const updatedMatch = await db.collection('matches').findOne({
      _id: new ObjectId(id)
    });
    
    if (updatedMatch && updatedMatch.confirmedPlayers && 
        updatedMatch.players && 
        updatedMatch.confirmedPlayers.length === updatedMatch.players.length) {
      // Todos os jogadores confirmaram, atualizar status para 'started'
      await db.collection('matches').updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'started', startedAt: new Date() } }
      );
    }
    
    return jsonResponse({
      success: true,
      message: 'Entrada confirmada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao confirmar entrada na partida:', error);
    return jsonResponse(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 