import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';

export async function GET(request: NextRequest) {
  try {
    console.log('Iniciando correção de rank para o usuário Yuri...');
    
    // Conectar ao banco de dados
    const { db } = await connectToDatabase();
    console.log('Conexão com o banco de dados estabelecida');
    
    // Definir o rank para gold com 750 pontos
    const result = await db.collection('users').updateOne(
      { username: 'yuri' }, 
      { 
        $set: { 
          rank: {
            tier: 'gold',
            division: '2',
            points: 750
          }
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('Usuário Yuri não encontrado');
      return NextResponse.json({ 
        success: false, 
        message: 'Usuário Yuri não encontrado' 
      });
    }
    
    if (result.modifiedCount === 0) {
      console.log('Nenhuma alteração foi necessária, usuário já estava com o rank correto');
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhuma alteração foi necessária, usuário já estava com o rank correto' 
      });
    }
    
    console.log('Rank do usuário Yuri atualizado com sucesso para Gold 2');
    
    // Buscar o usuário atualizado para confirmar
    const updatedUser = await db.collection('users').findOne({ username: 'yuri' });
    console.log('Usuário atualizado:', updatedUser);
    
    if (!updatedUser) {
      return NextResponse.json({ 
        success: true, 
        message: 'Rank atualizado, mas não foi possível recuperar o usuário para verificação'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rank do usuário Yuri corrigido para Gold 2',
      user: {
        username: updatedUser.username,
        rank: updatedUser.rank
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao corrigir rank do usuário Yuri:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao corrigir rank', 
      details: error.message 
    }, { 
      status: 500 
    });
  }
} 