/**
 * Controlador de rankings
 * Responsável por gerenciar os rankings de jogadores e equipes
 */

const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class RankingController {
  /**
   * Obter ranking de apostadores
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getBettorRanking(req, res, next) {
    try {
      // Simulação de parâmetros de filtro e paginação
      const { period = 'weekly', page = 1, limit = 10 } = req.query;
      
      logger.info(`Buscando ranking de apostadores, período: ${period}`);
      
      // Simulação de dados de ranking
      // Em um ambiente real, buscaria do banco de dados com filtros
      const bettors = [];
      
      // Gerar 50 apostadores simulados
      for (let i = 0; i < 50; i++) {
        bettors.push({
          id: `user_${1000 + i}`,
          username: `Player${1000 + i}`,
          avatar: `https://via.placeholder.com/50?text=P${1000 + i}`,
          level: Math.floor(Math.random() * 30) + 1,
          winnings: Math.round((5000 - (i * 100)) * 100) / 100,
          betsWon: Math.floor((200 - (i * 4)) * Math.random()) + 5,
          winRate: Math.round((0.8 - (i * 0.015)) * 100),
          streak: Math.floor(Math.random() * 10),
          country: i % 5 === 0 ? 'Brasil' : (i % 5 === 1 ? 'Argentina' : (i % 5 === 2 ? 'Chile' : (i % 5 === 3 ? 'Colômbia' : 'Peru'))),
          vip: i < 10
        });
      }
      
      // Aplicar filtros simulados baseados no período
      // Em um ambiente real, os dados já viriam filtrados do banco
      
      // Aplicar paginação simulada
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedBettors = bettors.slice(startIndex, endIndex);
      
      // Adicionar posição no ranking
      const rankedBettors = paginatedBettors.map((bettor, index) => {
        return {
          ...bettor,
          position: startIndex + index + 1
        };
      });
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        period,
        count: bettors.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(bettors.length / limit),
        data: rankedBettors
      });
    } catch (error) {
      logger.error(`Erro ao buscar ranking de apostadores: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter ranking de equipes de Free Fire
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getTeamRanking(req, res, next) {
    try {
      // Simulação de parâmetros de filtro e paginação
      const { region = 'global', tournament, page = 1, limit = 10 } = req.query;
      
      logger.info(`Buscando ranking de equipes, região: ${region}, torneio: ${tournament || 'todos'}`);
      
      // Simulação de dados de ranking
      // Em um ambiente real, buscaria do banco de dados com filtros
      const teams = [];
      
      // Gerar 30 times simulados
      for (let i = 0; i < 30; i++) {
        const teamId = i % 2 === 0 ? `team_${100 + (i / 2)}` : `team_${200 + Math.floor(i / 2)}`;
        const teamPrefix = i % 2 === 0 ? 'Alpha' : 'Beta';
        
        teams.push({
          id: teamId,
          name: `Team ${teamPrefix} ${teamId.split('_')[1]}`,
          logo: `https://via.placeholder.com/50?text=T${teamId.split('_')[1]}`,
          region: i % 5 === 0 ? 'brasil' : (i % 5 === 1 ? 'latam' : (i % 5 === 2 ? 'asia' : (i % 5 === 3 ? 'europe' : 'na'))),
          points: Math.round((2000 - (i * 65)) * Math.random()) + 100,
          matches: 30,
          wins: Math.floor((20 - (i * 0.6)) * Math.random()) + 1,
          winRate: Math.round((0.7 - (i * 0.02)) * 100),
          avgPlacement: Math.min(12, Math.max(1, Math.round((i * 0.35) + 1) * 10) / 10),
          avgKills: Math.round((15 - (i * 0.4)) * 10) / 10,
          lastResults: [
            i % 4 === 0 ? 'win' : (i % 3 === 0 ? 'top3' : 'loss'),
            i % 5 === 0 ? 'win' : (i % 2 === 0 ? 'top3' : 'loss'),
            i % 6 === 0 ? 'win' : (i % 3 === 0 ? 'top3' : 'loss')
          ]
        });
      }
      
      // Aplicar filtros simulados
      let filteredTeams = [...teams];
      
      if (region && region !== 'global') {
        filteredTeams = filteredTeams.filter(team => team.region === region);
      }
      
      // Ordenar por pontos
      filteredTeams.sort((a, b) => b.points - a.points);
      
      // Aplicar paginação simulada
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedTeams = filteredTeams.slice(startIndex, endIndex);
      
      // Adicionar posição no ranking
      const rankedTeams = paginatedTeams.map((team, index) => {
        return {
          ...team,
          position: startIndex + index + 1
        };
      });
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        region,
        tournament: tournament || 'all',
        count: filteredTeams.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredTeams.length / limit),
        data: rankedTeams
      });
    } catch (error) {
      logger.error(`Erro ao buscar ranking de equipes: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter ranking de jogadores de Free Fire
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getPlayerRanking(req, res, next) {
    try {
      // Simulação de parâmetros de filtro e paginação
      const { region = 'global', role, team, page = 1, limit = 10 } = req.query;
      
      logger.info(`Buscando ranking de jogadores, região: ${region}, função: ${role || 'todas'}, time: ${team || 'todos'}`);
      
      // Simulação de dados de ranking
      // Em um ambiente real, buscaria do banco de dados com filtros
      const players = [];
      
      // Gerar 100 jogadores simulados
      for (let i = 0; i < 100; i++) {
        const teamId = `team_${100 + (i % 10)}`;
        const roles = ['Rusher', 'Sniper', 'Support', 'Leader', 'Flex'];
        
        players.push({
          id: `player_${1000 + i}`,
          name: `ProPlayer${1000 + i}`,
          teamId,
          teamName: `Team ${i % 2 === 0 ? 'Alpha' : 'Beta'} ${teamId.split('_')[1]}`,
          avatar: `https://via.placeholder.com/50?text=P${1000 + i}`,
          region: i % 5 === 0 ? 'brasil' : (i % 5 === 1 ? 'latam' : (i % 5 === 2 ? 'asia' : (i % 5 === 3 ? 'europe' : 'na'))),
          role: roles[i % roles.length],
          kills: Math.floor((500 - (i * 4.5)) * Math.random()) + 50,
          kd: Math.round(((5 - (i * 0.045)) * Math.random() + 0.8) * 100) / 100,
          damage: Math.floor((100000 - (i * 950)) * Math.random()) + 5000,
          avgDamage: Math.floor((1500 - (i * 14)) * Math.random()) + 200,
          headshots: Math.round(((40 - (i * 0.35)) * Math.random()) * 10) / 10,
          matches: 50,
          mvps: Math.floor((30 - (i * 0.28)) * Math.random()) + 1
        });
      }
      
      // Aplicar filtros simulados
      let filteredPlayers = [...players];
      
      if (region && region !== 'global') {
        filteredPlayers = filteredPlayers.filter(player => player.region === region);
      }
      
      if (role) {
        filteredPlayers = filteredPlayers.filter(player => player.role === role);
      }
      
      if (team) {
        filteredPlayers = filteredPlayers.filter(player => player.teamId === team);
      }
      
      // Ordenar por kills
      filteredPlayers.sort((a, b) => b.kills - a.kills);
      
      // Aplicar paginação simulada
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);
      
      // Adicionar posição no ranking
      const rankedPlayers = paginatedPlayers.map((player, index) => {
        return {
          ...player,
          position: startIndex + index + 1
        };
      });
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        region,
        role: role || 'all',
        team: team || 'all',
        count: filteredPlayers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredPlayers.length / limit),
        data: rankedPlayers
      });
    } catch (error) {
      logger.error(`Erro ao buscar ranking de jogadores: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter estatísticas pessoais do usuário atual
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getPersonalStats(req, res, next) {
    try {
      const userId = req.user.id;
      
      logger.info(`Buscando estatísticas pessoais do usuário: ${userId}`);
      
      // Simulação de estatísticas pessoais
      // Em um ambiente real, buscaria do banco de dados
      const personalStats = {
        userId,
        username: req.user.username,
        avatar: `https://ui-avatars.com/api/?name=${req.user.username}&background=random`,
        level: 15,
        xp: 7500,
        nextLevelXp: 10000,
        stats: {
          totalBets: 247,
          betsWon: 132,
          betsLost: 107,
          betsCanceled: 8,
          winRate: 55.2,
          avgOdds: 2.35,
          highestWin: {
            amount: 2500,
            odds: 5.25,
            date: '2023-11-15T18:30:00Z',
            matchId: 'match_1042'
          },
          profitLoss: 3750.75,
          roiPercentage: 23.5
        },
        ranking: {
          weekly: {
            position: 17,
            totalParticipants: 1255
          },
          monthly: {
            position: 24,
            totalParticipants: 3489
          },
          allTime: {
            position: 87,
            totalParticipants: 12478
          }
        },
        betDistribution: {
          matchWinner: 65,
          firstBlood: 25,
          totalKills: 10
        },
        recentActivity: [
          {
            type: 'bet_won',
            amount: 200,
            winnings: 500,
            matchId: 'match_1105',
            date: '2023-11-28T15:45:00Z'
          },
          {
            type: 'bet_lost',
            amount: 100,
            matchId: 'match_1104',
            date: '2023-11-28T14:30:00Z'
          },
          {
            type: 'deposit',
            amount: 500,
            method: 'pix',
            date: '2023-11-27T10:15:00Z'
          }
        ],
        achievements: [
          {
            id: 'first_win',
            name: 'Primeira Vitória',
            description: 'Ganhe sua primeira aposta',
            completed: true,
            completedAt: '2023-10-05T18:22:00Z'
          },
          {
            id: 'high_roller',
            name: 'Alto Apostador',
            description: 'Faça uma aposta de pelo menos 1000',
            completed: true,
            completedAt: '2023-11-12T20:15:00Z'
          },
          {
            id: 'winning_streak',
            name: 'Sequência Vencedora',
            description: 'Ganhe 5 apostas consecutivas',
            completed: false,
            progress: 3,
            total: 5
          }
        ]
      };
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        data: personalStats
      });
    } catch (error) {
      logger.error(`Erro ao buscar estatísticas pessoais: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter estatísticas globais da plataforma
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getGlobalStats(req, res, next) {
    try {      
      logger.info('Buscando estatísticas globais da plataforma');
      
      // Simulação de estatísticas globais
      // Em um ambiente real, buscaria do banco de dados
      const globalStats = {
        users: {
          total: 45782,
          active: 15340,
          growth: 8.5
        },
        bets: {
          total: 1245789,
          totalVolume: 8754320.50,
          avgBetAmount: 75.23,
          popularMarkets: [
            { name: 'Match Winner', percentage: 62 },
            { name: 'First Blood', percentage: 18 },
            { name: 'Total Kills', percentage: 12 },
            { name: 'MVP', percentage: 8 }
          ]
        },
        matches: {
          total: 8750,
          live: 4,
          upcoming: 28
        },
        topWinners: [
          { username: 'Player1042', winnings: 25750.25 },
          { username: 'Player1084', winnings: 18920.00 },
          { username: 'Player1007', winnings: 15340.75 }
        ],
        topOdds: {
          current: { match: 'match_1062', market: 'MVP', selection: 'Player2005', odds: 15.5 },
          allTime: { match: 'match_432', market: 'First Blood', selection: 'Team Beta 203', odds: 25.0, winner: true }
        },
        recentBigWins: [
          { username: 'Player1098', amount: 500, winnings: 7500, odds: 15.0, matchId: 'match_1045', date: '2023-11-27T19:30:00Z' },
          { username: 'Player1042', amount: 1000, winnings: 6000, odds: 6.0, matchId: 'match_1042', date: '2023-11-26T18:15:00Z' }
        ]
      };
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        data: globalStats
      });
    } catch (error) {
      logger.error(`Erro ao buscar estatísticas globais: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new RankingController(); 