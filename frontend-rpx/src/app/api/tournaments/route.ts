import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Tournament from '@/models/Tournament';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// Middleware para verificar autenticação
async function checkAdminAccess() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.id) {
    return { isAuth: false, isAdmin: false, error: 'Não autorizado', userId: null };
  }
  
  // Implementar lógica para verificar se o usuário é administrador
  // Isso dependerá da sua estrutura de dados
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(session.user.id)
    });
    
    if (!user) {
      return { isAuth: true, isAdmin: false, error: 'Usuário não encontrado', userId: session.user.id };
    }
    
    const isAdminUser = user.role === 'admin' || user.isAdmin === true;
    
    return { 
      isAuth: true, 
      isAdmin: isAdminUser, 
      error: isAdminUser ? null : 'Acesso restrito a administradores', 
      userId: session.user.id 
    };
  } catch (error) {
    console.error('Erro ao verificar permissão de administrador:', error);
    return { isAuth: true, isAdmin: false, error: 'Erro ao verificar permissões', userId: session.user.id };
  }
}

// GET: Obter lista de torneios
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const format = searchParams.get('format');
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    
    await connectToDatabase();
    
    // Construir query com base nos parâmetros
    let query: any = {};
    
    if (status) {
      query.status = status;
    } else {
      // Por padrão, apenas torneios publicados, em inscrição ou em andamento
      query.status = { $in: ['published', 'registration', 'in_progress'] };
    }
    
    if (format) {
      query.format = format;
    }
    
    if (featured) {
      query.featured = true;
    }
    
    // Paginação
    const skip = (page - 1) * limit;
    
    // Buscar torneios
    const tournaments = await Tournament.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();
    
    // Contar total para paginação
    const total = await Tournament.countDocuments(query);
    
    return NextResponse.json({
      status: 'success',
      data: {
        tournaments,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar torneios:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao buscar torneios'
    }, { status: 500 });
  }
}

// POST: Criar novo torneio (apenas administradores)
export async function POST(request: NextRequest) {
  try {
    const { isAuth, isAdmin, error, userId } = await checkAdminAccess();
    
    if (!isAuth || !isAdmin) {
      return NextResponse.json({
        status: 'error',
        error: error
      }, { status: isAuth ? 403 : 401 });
    }
    
    const body = await request.json();
    
    // Validar dados obrigatórios
    const requiredFields = [
      'name', 'description', 'startDate', 'endDate', 
      'registrationStartDate', 'registrationEndDate', 'format',
      'gameRules', 'maxParticipants', 'image'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          status: 'error',
          error: `Campo obrigatório ausente: ${field}`
        }, { status: 400 });
      }
    }
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Criar o torneio
    const tournament = await Tournament.create({
      ...body,
      createdBy: new mongoose.Types.ObjectId(userId),
      currentParticipants: 0,
      // Valores padrão para campos não fornecidos
      bracketType: body.bracketType || 'single_elimination',
      status: body.status || 'draft',
      entryFee: body.entryFee || 0,
      prizePool: body.prizePool || 0,
      minParticipants: body.minParticipants || 2,
      featured: body.featured || false,
      isPublic: body.isPublic !== undefined ? body.isPublic : true,
      participants: [],
      matches: [],
      prizes: body.prizes || []
    });
    
    return NextResponse.json({
      status: 'success',
      data: {
        tournament
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar torneio:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Erro ao criar torneio'
    }, { status: 500 });
  }
} 