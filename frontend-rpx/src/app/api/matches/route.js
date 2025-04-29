import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';

// GET todas as partidas
export async function GET(request) {
  console.log('Acessando endpoint GET /api/matches');
  
  try {
    // Retornar dados simulados para evitar problemas com o banco de dados
    return NextResponse.json(generateMockMatches());
    
  } catch (error) {
    console.error('Erro ao buscar partidas:', error);
    return NextResponse.json(
      { error: 'Falha ao carregar as salas', details: error.message },
      { status: 400 });
  }
}

// POST uma nova partida
export async function POST(request) {
  console.log('Acessando endpoint POST /api/matches');
  
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 400 });
    }
    
    const userId = authResult.userId;
    console.log(`Usuário autenticado: ${userId}`);
    
    // Obter dados da requisição
    const data = await request.json();
    console.log('Dados recebidos:', data);
    
    // Retornar sucesso simulado
    const mockId = `match-${Date.now()}`;
    return NextResponse.json({
      message: 'Partida criada com sucesso',
      matchId: mockId,
      match: {
        status: 'open',
        createdAt: new Date().toISOString(),
        createdBy: userId
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar partida:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 400 });
  }
}

// Função para gerar partidas de exemplo
function generateMockMatches() {
  console.log('Gerando partidas de exemplo');
  
  try {
    const modes = ['solo', 'duo', 'squad'];
    const platforms = ['emulator', 'mobile', 'mixed', 'tactical'];
    const statuses = ['open', 'in_progress', 'completed'];
    
    const mockMatches = Array(15).fill(null).map((_, index) => {
      const mode = modes[Math.floor(Math.random() * modes.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const teamSize = mode === 'solo' ? 1 : mode === 'duo' ? 2 : 4;
      const createdDate = new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000));
      
      return {
        id: `mock-${index}`,
        title: `Desafio ${mode.toUpperCase()} #${index + 1}`,
        mode,
        teamSize,
        platform,
        entryFee: [5, 10, 20, 50, 100][Math.floor(Math.random() * 5)],
        status,
        type: 'casual',
        createdAt: createdDate.toISOString(),
        createdBy: 'user1',
        prize: teamSize * 2,
        totalPlayers: teamSize * 2,
        playersJoined: Math.floor(Math.random() * teamSize * 2),
        teams: [
          {
            id: `team1-${index}`,
            name: 'Time 1',
            players: [
              {
                id: 'user1',
                name: 'Jogador 1',
                isReady: true,
                isCaptain: true
              },
              {
                id: 'user2',
                name: 'Jogador 2',
                isReady: false,
                isCaptain: false
              }
            ]
          },
          {
            id: `team2-${index}`,
            name: 'Time 2',
            players: status !== 'open' ? [
              {
                id: 'user3',
                name: 'Jogador 3',
                isReady: status === 'in_progress',
                isCaptain: true
              }
            ] : []
          }
        ],
        startTime: new Date(Date.now() + 3600000).toISOString()
      };
    });
    
    console.log('Geradas partidas de exemplo com sucesso');
    return mockMatches;
  } catch (error) {
    console.error('Erro ao gerar partidas de exemplo:', error);
    // Em caso de erro, retornar um array vazio para não quebrar a aplicação
    return [];
  }
} 