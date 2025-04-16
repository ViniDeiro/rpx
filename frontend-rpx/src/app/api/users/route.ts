import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb/connect';

// GET - Obter todos os usuários cadastrados
export async function GET(req: NextRequest) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const includeAvatars = url.searchParams.get('includeAvatars') === 'true';
    
    console.log(`Buscando usuários com includeAvatars=${includeAvatars}`);
    
    // Conectar ao MongoDB
    await connectToDatabase();
    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados' },
        { status: 500 }
      );
    }
    
    // Preparar filtro de busca
    const searchFilter: any = {};
    if (search) {
      searchFilter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { 'profile.name': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Definir campos a projetar
    const projectFields: any = {
      _id: 1,
      username: 1,
      'profile.name': 1,
      'profile.avatar': 1,
      email: 1,
      createdAt: 1,
      status: 1
    };
    
    // Incluir avatarUrl se solicitado
    if (includeAvatars) {
      projectFields.avatarUrl = 1;
    }
    
    // Buscar usuários
    const users = await db.collection('users')
      .find(searchFilter)
      .project(projectFields)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    console.log(`Encontrados ${users.length} usuários`);
    
    // Formatar dados para resposta
    const formattedUsers = users.map(user => {
      const formatted = {
        _id: user._id.toString(),
        id: user._id.toString(),
        username: user.username,
        name: user.profile?.name || user.username,
        avatar: user.profile?.avatar || null,
        email: user.email,
        createdAt: user.createdAt,
        status: user.status || 'active'
      };
      
      // Incluir avatarUrl se estiver disponível e solicitado
      if (includeAvatars && user.avatarUrl) {
        // Se avatarUrl for muito grande, cortar para log
        const avatarPreview = typeof user.avatarUrl === 'string' && user.avatarUrl.length > 50 
          ? user.avatarUrl.substring(0, 20) + '...' + user.avatarUrl.substring(user.avatarUrl.length - 20)
          : 'não é string';
        
        console.log(`Usuário ${user.username} tem avatarUrl (tamanho: ${typeof user.avatarUrl === 'string' ? user.avatarUrl.length : 'N/A'}, preview: ${avatarPreview})`);
        
        (formatted as any).avatarUrl = user.avatarUrl;
      }
      
      return formatted;
    });
    
    // Registrar quantos usuários têm avatarUrl
    if (includeAvatars) {
      const withAvatars = formattedUsers.filter((user: any) => user.avatarUrl).length;
      console.log(`${withAvatars} de ${formattedUsers.length} usuários têm avatarUrl`);
    }
    
    // Retornar dados formatados
    return NextResponse.json({
      users: formattedUsers,
      count: formattedUsers.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erro ao obter usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao obter usuários' },
      { status: 500 }
    );
  }
} 