import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';
import { isAuthenticated } from '@/lib/auth/verify';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('API Lobby GET - Iniciando processamento da solicitação', params.id);

  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('API Lobby GET - Erro: Usuário não autenticado');
      return NextResponse.json({
        status: 'error',
        error: 'Não autorizado'
      }, { status: 401 });
    }

    const userEmail = session.user.email;
    console.log(`API Lobby GET - Usuário autenticado: ${userEmail}`);

    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    if (!db) {
      console.log('API Lobby GET - Erro: Falha na conexão com o banco de dados');
      return NextResponse.json({
        status: 'error',
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }

    // Obter usuário atual a partir do email
    const user = await db.collection('users').findOne({ email: userEmail });
    if (!user) {
      console.log(`API Lobby GET - Erro: Usuário não encontrado para o email ${userEmail}`);
      return NextResponse.json({
        status: 'error',
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }

    // Converter o ID do parâmetro para ObjectId
    let lobbyObjectId;
    try {
      lobbyObjectId = new ObjectId(params.id);
      console.log(`API Lobby GET - ID do lobby convertido para ObjectId: ${lobbyObjectId.toString()}`);
    } catch (e) {
      console.log(`API Lobby GET - Erro: ID de lobby inválido: ${params.id}`);
      return NextResponse.json({
        status: 'error',
        error: 'ID de lobby inválido'
      }, { status: 400 });
    }

    // Buscar o lobby
    const lobby = await db.collection('lobbies').findOne({ _id: lobbyObjectId });
    if (!lobby) {
      console.log(`API Lobby GET - Erro: Lobby não encontrado para o ID ${lobbyObjectId.toString()}`);
      return NextResponse.json({
        status: 'error',
        error: 'Lobby não encontrado'
      }, { status: 404 });
    }

    console.log(`API Lobby GET - Lobby encontrado: ${lobby.name || 'Sem nome'}`);

    // Verificar se o usuário está nos membros do lobby
    const userIdString = user._id.toString();
    const isUserMember = lobby.members && lobby.members.some((memberId: any) => 
      (typeof memberId === 'object' ? memberId.toString() : memberId) === userIdString
    );

    // Se o usuário não for membro, verificar se há um convite pendente
    if (!isUserMember) {
      console.log(`API Lobby GET - Usuário ${userIdString} não é membro do lobby. Verificando convites...`);
      
      const pendingInvite = await db.collection('lobbyinvites').findOne({
        lobbyId: { $in: [lobbyObjectId, lobbyObjectId.toString()] },
        recipient: { $in: [user._id, userIdString] },
        status: 'pending'
      });

      if (!pendingInvite) {
        console.log(`API Lobby GET - Erro: Usuário não tem acesso ao lobby e não possui convite pendente`);
        return NextResponse.json({
          status: 'error',
          error: 'Acesso negado ao lobby'
        }, { status: 403 });
      }
      
      console.log(`API Lobby GET - Convite pendente encontrado para o usuário`);
    }

    // Buscar membros do lobby
    let members: any[] = [];
    try {
      members = await db.collection('lobbymembers')
        .find({ 
          lobbyId: { $in: [lobbyObjectId, lobbyObjectId.toString()] }
        })
        .toArray();
      
      console.log(`API Lobby GET - ${members.length} membros encontrados no lobby`);
    } catch (e) {
      console.error('API Lobby GET - Erro ao buscar membros:', e);
      // Continuar mesmo se não encontrar membros
      console.log('API Lobby GET - Continuando mesmo sem membros encontrados');
    }

    // Buscar mensagens do chat
    let chat: any[] = [];
    try {
      chat = await db.collection('lobbychat')
        .find({ 
          lobbyId: { $in: [lobbyObjectId, lobbyObjectId.toString()] }
        })
        .sort({ timestamp: 1 })
        .limit(50)
        .toArray();
      
      console.log(`API Lobby GET - ${chat.length} mensagens de chat encontradas`);
    } catch (e) {
      console.error('API Lobby GET - Erro ao buscar chat:', e);
      // Continuar mesmo se não encontrar chat
      console.log('API Lobby GET - Continuando mesmo sem mensagens de chat');
    }

    // Formatar resposta
    const formattedResponse = {
      _id: lobby._id.toString(),
      name: lobby.name,
      type: lobby.lobbyType,
      maxPlayers: lobby.maxPlayers,
      gameMode: lobby.gameMode,
      createdAt: lobby.createdAt,
      status: lobby.status,
      members: members.map(member => ({
        ...member,
        _id: member._id.toString(),
        userId: typeof member.userId === 'object' ? member.userId.toString() : member.userId,
        lobbyId: typeof member.lobbyId === 'object' ? member.lobbyId.toString() : member.lobbyId
      })),
      chat: chat.map(msg => ({
        ...msg,
        _id: msg._id.toString(),
        lobbyId: typeof msg.lobbyId === 'object' ? msg.lobbyId.toString() : msg.lobbyId,
        userId: msg.userId ? (typeof msg.userId === 'object' ? msg.userId.toString() : msg.userId) : null
      }))
    };

    console.log(`API Lobby GET - Resposta formatada com sucesso. Retornando dados do lobby ${lobby._id.toString()}`);
    
    return NextResponse.json({
      status: 'success',
      data: formattedResponse
    });
  } catch (error: any) {
    console.error('API Lobby GET - Erro não tratado:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao buscar dados do lobby: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
} 