import { request, NextResponse } from 'next/server';
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
const gerarUsuariosSimulados = (quantidade, includeAvatars, search = '') => {
  const users = [];
  
  for (let i = 0; i < quantidade; i++) {
    const username = gerarNomeAleatorio();
    
    // Se houver filtro de pesquisa, verifique se o nome contém a string
    if (search && !username.toLowerCase().includes(search.toLowerCase())) {
      continue;
    }
    
    const user = {
      id: uuidv4(),
      username: username,
      email: `${username.toLowerCase()}@email.com`,
      level: Math.floor(Math.random() * 100) + 1,
      createdAt: new Date(Date.now() - Math.random() * 3600 * 24 * 365 * 1000).toISOString(),
      avatar: gerarAvatarAleatorio(),
      status: Math.random() > 0.2 ? 'active' : 'offline'
    };
    
    // Adicionar avatarUrl se solicitado
    if (includeAvatars) {
      user.avatarUrl = user.avatar;
    }
    
    users.push(user);
  }
  
  return users;
};

// GET - Obter todos os usuários (simulado)
export async function GET(req) {
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
      const withAvatars = usuarios.filter((user) => user.avatarUrl).length;
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
      { status: 400 });
  }
} 