import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// GET: Obter informações de rank de usuários específicos
export async function GET(request) {
  try {
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar todos os usuários
    const users = await db.collection('users').find({
      username: { $in: ['luiz', 'joao', 'julia', 'bianca', 'yuri', 'dacruz', 'vini', 'ygorx'] }
    }).project({
      name: 1,
      username: 1,
      rankingPoints: 1,
      currentRank: 1,
      avatarUrl: 1
    }).toArray();
    
    // Extrair e formatar os dados relevantes
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      name: user.name || user.username,
      rankingPoints: user.rankingPoints || 0,
      currentRank: user.currentRank || 'Novato',
      avatarUrl: user.avatarUrl || null
    }));
    
    return NextResponse.json({
      status: 'success',
      data: formattedUsers
    });
  } catch (error) {
    console.error('Erro ao verificar ranks dos usuários:', error);
    return NextResponse.json(
      { status: 'error', error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 