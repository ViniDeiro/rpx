import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';

export async function GET(request) {
  try {
    console.log('🚑 Rota de emergência para busca de usuários ativada');
    
    // Verificar ambiente
    if (process.env.NODE_ENV !== 'development') {
      console.log('⚠️ Rota de emergência só disponível em ambiente de desenvolvimento');
      return NextResponse.json(
        { error: 'Esta rota só está disponível em ambiente de desenvolvimento' },
        { status: 403 });
    }
    
    // Conectar ao banco de dados
    console.log('🔄 Conectando ao banco de dados...');
    const { db } = await connectToDatabase();
    console.log('✅ Conectado ao banco de dados com sucesso');
    
    // Buscar todos os usuários diretamente, sem filtros ou projeções
    console.log('🔍 Buscando usuários com método de emergência...');
    const usersRaw = await db.collection('users').find().toArray();
    
    // Contar quantos usuários foram encontrados
    console.log(`🔢 Encontrados ${usersRaw.length} usuários no banco de dados`);
    
    // Mapear para garantir formato consistente
    const users = usersRaw.map(user => ({
      id: user._id.toString(),
      name: user.name || user.username || 'Usuário sem nome',
      email: user.email || 'sem-email@exemplo.com',
      username: user.username || user.email?.split('@')[0] || 'sem-username',
      isAdmin: user.isAdmin === true,
      createdAt: user.createdAt || new Date().toISOString()
    }));
    
    // Retornar os usuários
    return NextResponse.json({ success: true, data: users });
    
  } catch (error) {
    console.error('❌ Erro na rota de emergência:', error);
    return NextResponse.json(
      { error: error.message || 'Erro na rota de emergência' },
      { status: 500 });
  }
} 