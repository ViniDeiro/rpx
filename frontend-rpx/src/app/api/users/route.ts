import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Função para gerar nomes aleatórios
const gerarNomeAleatorio = () => {
  const nomes = ['Gabriel', 'Lucas', 'Pedro', 'Rafael', 'Matheus', 'João', 'Bruno', 'Carlos', 'Felipe', 'Victor', 
                 'Diego', 'Daniel', 'Guilherme', 'Rodrigo', 'Gustavo', 'André', 'Thiago', 'Marcelo', 'Ricardo', 'Eduardo'];
  const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Ferreira', 'Rodrigues', 'Almeida', 'Gomes',
                     'Ribeiro', 'Martins', 'Rocha', 'Carvalho', 'Fernandes', 'Melo', 'Barbosa', 'Dias', 'Lima', 'Lopes'];
  return `${nomes[Math.floor(Math.random() * nomes.length)]}${sobrenomes[Math.floor(Math.random() * sobrenomes.length)]}`;
};

// Função para gerar avatar aleatório
const gerarAvatarAleatorio = () => {
  const avatarId = Math.floor(Math.random() * 12) + 1;
  return `/images/avatars/avatar${avatarId}.png`;
};

// Função para gerar dados de usuários simulados
const gerarUsuariosSimulados = (quantidade: number, includeAvatars: boolean, search?: string): any[] => {
  const users = [];
  
  for (let i = 0; i < quantidade; i++) {
    const username = gerarNomeAleatorio();
    
    // Se houver um termo de busca, verificar se o nome corresponde
    if (search && !username.toLowerCase().includes(search.toLowerCase())) {
      // Gerar novo usuário para manter a quantidade solicitada
      i--;
      continue;
    }
    
    const user = {
      _id: uuidv4(),
      id: uuidv4(),
      username: username,
      name: username,
      email: `${username.toLowerCase()}@exemplo.com`,
      avatar: gerarAvatarAleatorio(),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // até 30 dias atrás
      status: Math.random() > 0.2 ? 'active' : 'offline'
    };
    
    // Adicionar avatarUrl se solicitado
    if (includeAvatars) {
      (user as any).avatarUrl = user.avatar;
    }
    
    users.push(user);
  }
  
  return users;
};

// GET - Obter todos os usuários (simulado)
export async function GET(req: NextRequest) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const includeAvatars = url.searchParams.get('includeAvatars') === 'true';
    
    console.log(`Buscando usuários simulados com includeAvatars=${includeAvatars}`);
    
    // Simular pequeno atraso para parecer realista
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Gerar dados simulados
    const usuarios = gerarUsuariosSimulados(limit, includeAvatars, search);
    
    console.log(`Gerados ${usuarios.length} usuários simulados`);
    
    // Registrar quantos usuários têm avatarUrl
    if (includeAvatars) {
      const withAvatars = usuarios.filter((user: any) => user.avatarUrl).length;
      console.log(`${withAvatars} de ${usuarios.length} usuários simulados têm avatarUrl`);
    }
    
    // Retornar dados simulados
    return NextResponse.json({
      users: usuarios,
      count: usuarios.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erro ao gerar usuários simulados:', error);
    return NextResponse.json(
      { error: 'Erro ao obter usuários' },
      { status: 500 }
    );
  }
} 