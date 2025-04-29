import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { ObjectId } from 'mongodb';

// Função para verificar se o usuário é administrador
async function isAdmin(userId) {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    return user?.isAdmin === true;
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
}

// GET - Listar verificações de CPF
export async function GET(request) {
  try {
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { status: 'error', error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se o usuário é admin
    const isUserAdmin = await isAdmin(session.user.id);
    
    if (!isUserAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }
    
    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Calcular o offset para paginação
    const skip = (page - 1) * limit;
    
    // Construir filtro
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar verificações de CPF
    const verifications = await db.collection('cpf_verifications')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Contar total de registros para paginação
    const total = await db.collection('cpf_verifications').countDocuments(filter);
    
    // Obter dados dos usuários relacionados
    const userIds = verifications.map(v => v.userId);
    const users = await db.collection('users')
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .project({ _id: 1, name: 1, email: 1, username: 1 })
      .toArray();
    
    // Criar mapeamento de ID para dados do usuário
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });
    
    // Formatar resposta
    const formattedVerifications = verifications.map(v => ({
      id: v._id.toString(),
      userId: v.userId,
      cpf: v.cpf,
      name: v.name,
      birthDate: v.birthDate,
      status: v.status,
      requestDate: v.createdAt,
      verifiedDate: v.verifiedAt,
      notes: v.notes,
      user: userMap[v.userId] ? {
        id: userMap[v.userId]._id.toString(),
        name: userMap[v.userId].name,
        email: userMap[v.userId].email,
        username: userMap[v.userId].username
      } : null
    }));
    
    return NextResponse.json({
      status: 'success',
      data: formattedVerifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar verificações de CPF:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao listar verificações de CPF: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
}

// POST - Aprovar ou rejeitar verificação de CPF
export async function POST(request) {
  try {
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { status: 'error', error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se o usuário é admin
    const isUserAdmin = await isAdmin(session.user.id);
    
    if (!isUserAdmin) {
      return NextResponse.json(
        { status: 'error', error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }
    
    // Obter dados da requisição
    const body = await request.json();
    const { id, status, notes } = body;
    
    if (!id || !status) {
      return NextResponse.json(
        { status: 'error', error: 'ID e status são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { status: 'error', error: 'Status deve ser approved ou rejected' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar verificação pelo ID
    const verification = await db.collection('cpf_verifications').findOne({
      _id: new ObjectId(id)
    });
    
    if (!verification) {
      return NextResponse.json(
        { status: 'error', error: 'Verificação de CPF não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se a verificação já foi processada
    if (verification.status !== 'pending') {
      return NextResponse.json(
        { status: 'error', error: 'Esta verificação já foi processada' },
        { status: 400 }
      );
    }
    
    // Atualizar status da verificação
    const updateResult = await db.collection('cpf_verifications').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          notes: notes || '',
          verifiedAt: new Date(),
          verifiedBy: session.user.id,
          updatedAt: new Date()
        }
      }
    );
    
    if (!updateResult.acknowledged || updateResult.matchedCount === 0) {
      return NextResponse.json(
        { status: 'error', error: 'Falha ao atualizar verificação de CPF' },
        { status: 500 }
      );
    }
    
    // Se aprovado, atualizar status de verificação do usuário
    if (status === 'approved') {
      await db.collection('users').updateOne(
        { _id: new ObjectId(verification.userId) },
        {
          $set: {
            cpfVerified: true,
            cpfVerifiedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );
      
      // Adicionar notificação para o usuário
      await db.collection('notifications').insertOne({
        userId: verification.userId,
        type: 'cpf_verification',
        title: 'CPF Verificado com Sucesso',
        message: 'Seu CPF foi verificado e aprovado. Sua conta agora tem acesso aos recursos completos da plataforma.',
        read: false,
        createdAt: new Date()
      });
    } else if (status === 'rejected') {
      // Adicionar notificação para o usuário sobre rejeição
      await db.collection('notifications').insertOne({
        userId: verification.userId,
        type: 'cpf_verification',
        title: 'Verificação de CPF Rejeitada',
        message: notes 
          ? `Sua verificação de CPF foi rejeitada. Motivo: ${notes}`
          : 'Sua verificação de CPF foi rejeitada. Entre em contato com o suporte para mais informações.',
        read: false,
        createdAt: new Date()
      });
    }
    
    // Registrar ação de admin
    await db.collection('admin_logs').insertOne({
      adminId: session.user.id,
      action: `cpf_verification_${status}`,
      details: {
        verificationId: id,
        userId: verification.userId,
        notes: notes || ''
      },
      createdAt: new Date()
    });
    
    return NextResponse.json({
      status: 'success',
      message: status === 'approved' 
        ? 'Verificação de CPF aprovada com sucesso' 
        : 'Verificação de CPF rejeitada'
    });
  } catch (error) {
    console.error('Erro ao processar verificação de CPF:', error);
    return NextResponse.json(
      { status: 'error', error: 'Erro ao processar verificação de CPF: ' + (error.message || 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 