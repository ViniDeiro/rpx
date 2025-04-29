import { request, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Interface para entrada de ranking


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

// Função para gerar dados de ranking aleatórios
const gerarRankingSimulado = (quantidade, tipo) => {
  const entries = [];
  
  for (let i = 0; i < quantidade; i++) {
    const totalGames = Math.floor(Math.random() * 500) + 20;
    const wins = Math.floor(Math.random() * totalGames);
    const totalWon = Math.floor(Math.random() * 10000) + 100;
    const biggestWin = Math.floor(Math.random() * 2000) + 50;
    
    entries.push({
      id: uuidv4(),
      username: gerarNomeAleatorio(),
      avatar: gerarAvatarAleatorio(),
      rank: i + 1,
      score: Math.floor(Math.random() * 1000) + 100,
      wins,
      totalGames,
      winRate: totalGames > 0 ? (wins / totalGames * 100) : 0,
      totalWon,
      biggestWin,
    });
  }
  
  // Ordenar conforme o tipo
  if (tipo === 'winrate') {
    entries.sort((a, b) => b.winRate - a.winRate);
  } else if (tipo === 'totalWon') {
    entries.sort((a, b) => b.totalWon - a.totalWon);
  } else if (tipo === 'biggestWin') {
    entries.sort((a, b) => b.biggestWin - a.biggestWin);
  } else {
    entries.sort((a, b) => b.score - a.score);
  }
  
  // Atualizar ranking após ordenação
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return entries;
};

// GET - Obter rankings dos jogadores (simulado)
export async function GET(req) {
  try {
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'winrate'; // winrate, totalWon, biggestWin
    const period = url.searchParams.get('period') || 'week'; // all, week, month
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    // Simular um pequeno atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Gerar ranking simulado
    const rankingData = gerarRankingSimulado(limit, type);
    
    // Retornar dados simulados
    return NextResponse.json({
      rankings: rankingData,
      type,
      period,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao gerar ranking simulado:', error);
    return NextResponse.json(
      { error: 'Erro ao obter rankings' },
      { status: 400 });
  }
} 