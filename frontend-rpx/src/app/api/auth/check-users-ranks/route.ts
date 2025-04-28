import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';

export async function GET(request: NextRequest) {
  try {
    console.log('Verificando ranks dos usuários...');
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    
    // Buscar todos os usuários
    const users = await db.collection('users').find({
      username: { $in: ['luiz', 'joao', 'julia', 'bianca', 'yuri', 'dacruz', 'vini', 'ygorx'] }
    }).project({
      name: 1,
      username: 1,
      email: 1,
      rank: 1
    }).toArray();
    
    // Formatar os dados para melhor visualização
    const formattedUsers = users.map(user => {
      return {
        name: user.name,
        username: user.username,
        rank: user.rank ? user.rank.tier : 'unranked',
        points: user.rank ? user.rank.points : 0
      };
    });
    
    // Ordenar por pontos (decrescente)
    formattedUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
    
    return NextResponse.json({
      success: true,
      message: `Encontrados ${users.length} usuários`,
      users: formattedUsers,
      rawUsers: users // Incluir dados brutos para debug
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao verificar ranks dos usuários:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar ranks dos usuários' },
      { status: 500 }
    );
  }
} 