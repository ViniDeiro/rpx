import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface CPFVerification {
  _id: ObjectId;
  userId: string;
  cpf: string;
  name: string;
  birthDate: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

// Função auxiliar para verificar se é admin
async function isAdmin(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    return user?.isAdmin === true;
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return false;
  }
}

// GET - Buscar todas as verificações de CPF
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o usuário é admin
    const admin = await isAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    const cpfVerifications = await db.collection<CPFVerification>('cpf_verifications')
      .find({})
      .sort({ submittedAt: -1 })
      .toArray();

    // Enriquecer dados com informações de usuário
    const verifications = await Promise.all(cpfVerifications.map(async (verification: CPFVerification) => {
      try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(verification.userId) });
        return {
          ...verification,
          username: user?.username || 'Usuário desconhecido',
          _id: verification._id.toString()
        };
      } catch (e) {
        return {
          ...verification,
          username: 'Usuário desconhecido',
          _id: verification._id.toString()
        };
      }
    }));

    return NextResponse.json(verifications);
  } catch (error) {
    console.error('Erro ao buscar verificações de CPF:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST - Criar nova verificação de CPF (para usuários)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { cpf, name, birthDate } = body;

    // Validações básicas
    if (!cpf || !name || !birthDate) {
      return NextResponse.json(
        { error: 'CPF, nome completo e data de nascimento são obrigatórios' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Verificar se já existe verificação pendente ou aprovada para este usuário
    const existingVerification = await db.collection<CPFVerification>('cpf_verifications').findOne({
      userId: session.user.id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingVerification) {
      const status = existingVerification.status;
      return NextResponse.json(
        { 
          error: status === 'pending' 
            ? 'Você já possui uma verificação de CPF pendente' 
            : 'Você já possui um CPF verificado' 
        },
        { status: 400 }
      );
    }

    // Criar nova verificação
    const verification: Omit<CPFVerification, '_id'> = {
      userId: session.user.id,
      cpf: cpf.replace(/[^\d]/g, ''), // Remover formatação
      name,
      birthDate,
      submittedAt: new Date(),
      status: 'pending'
    };

    const result = await db.collection('cpf_verifications').insertOne(verification);

    return NextResponse.json({
      message: 'Verificação de CPF enviada com sucesso',
      id: result.insertedId.toString()
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar verificação de CPF:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 