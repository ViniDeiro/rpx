import { request, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb/connect';
import { getModels } from '@/lib/mongodb/models';
import { RankTier } from '@/utils/ranking';

// Mapeamento dos ranks para pontos predefinidos
const rankPoints = {
  'unranked': 0,
  'bronze': 150,
  'silver': 350,
  'gold': 700,
  'platinum': 1100,
  'diamond': 1600,
  'legend': 1900,
  'challenger': 2100
};

export async function POST(request) {
  try {
    // Extrair dados do corpo da requisição
    const body = await request.json();
    const { username, tier, division, points } = body;

    console.log('Recebido pedido para atualizar rank:', { username, tier, division, points });

    // Validar dados
    if (!username || !tier) {
      console.log('Erro: Usuário e rank são obrigatórios');
      return NextResponse.json(
        { error: 'Usuário e rank são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar o tier
    if (!Object.keys(rankPoints).includes(tier)) {
      console.log('Erro: Rank inválido:', tier);
      return NextResponse.json(
        { error: 'Rank inválido' },
        { status: 400 }
      );
    }

    try {
      // Conectar ao banco de dados
      console.log('Conectando ao banco de dados...');
      await connectToDatabase();
      console.log('Conexão estabelecida');
      
      const { User } = await getModels();
      console.log('Modelo de usuário obtido');

      // Buscar usuário pelo username
      console.log('Buscando usuário:', username);
      const user = await User.findOne({ username });

      if (!user) {
        console.log('Erro: Usuário não encontrado:', username);
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      console.log('Usuário encontrado:', user.username, 'ID:', user._id);
      console.log('Rank atual:', user.rank);

      // Determinar os pontos (usar os fornecidos ou os padrão para o tier)
      const rankPointsValue = points !== undefined ? points : rankPoints[tier];

      // Atualizar o rank do usuário
      user.rank = {
        tier,
        division: division || null,
        points: rankPointsValue
      };

      console.log('Novo rank a ser aplicado:', user.rank);

      // Salvar as alterações
      console.log('Salvando as alterações...');
      await user.save();
      console.log('Alterações salvas com sucesso');

      return NextResponse.json({
        success: true,
        message: `Rank do usuário ${username} atualizado para ${tier}`,
        user: {
          id: user._id ? user._id.toString() : "",
          username: user.username,
          rank: user.rank
        }
      });
    } catch (dbError) {
      console.error('Erro de banco de dados:', dbError);
      return NextResponse.json(
        { error: 'Erro ao acessar o banco de dados', details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro geral ao atualizar rank do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar rank do usuário', message: error.message },
      { status: 500 }
    );
  }
} 