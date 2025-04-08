/**
 * Controlador de torneios
 * Responsável por gerenciar os torneios de Free Fire disponíveis para apostas
 */

const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class TournamentController {
  /**
   * Obter todos os torneios disponíveis
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getAllTournaments(req, res, next) {
    try {
      // Simulação de parâmetros de filtro e paginação
      const { status, region, page = 1, limit = 10 } = req.query;
      
      logger.info('Buscando lista de torneios disponíveis');
      
      // Simulação de dados de torneios
      // Em um ambiente real, buscaria do banco de dados com filtros
      const tournaments = [
        {
          id: 'tournament_1',
          name: 'FFWS 2023 - Grand Finals',
          description: 'Free Fire World Series 2023 - Fase Final',
          status: 'ongoing',
          region: 'global',
          startDate: '2023-11-25T12:00:00Z',
          endDate: '2023-12-03T20:00:00Z',
          logo: 'https://via.placeholder.com/150?text=FFWS2023',
          prize: '$1,000,000',
          teams: 12,
          matches: 18,
          organizer: 'Garena',
          featured: true
        },
        {
          id: 'tournament_2',
          name: 'LBFF 10 - Série A',
          description: 'Liga Brasileira de Free Fire - Série A - 10ª Edição',
          status: 'upcoming',
          region: 'brazil',
          startDate: '2023-12-15T18:00:00Z',
          endDate: '2024-02-10T21:00:00Z',
          logo: 'https://via.placeholder.com/150?text=LBFF10',
          prize: 'R$500,000',
          teams: 18,
          matches: 36,
          organizer: 'Garena Brasil',
          featured: true
        },
        {
          id: 'tournament_3',
          name: 'Pro League Season 5',
          description: 'Temporada 5 da Pro League de Free Fire',
          status: 'completed',
          region: 'southeast_asia',
          startDate: '2023-09-01T14:00:00Z',
          endDate: '2023-10-20T19:00:00Z',
          logo: 'https://via.placeholder.com/150?text=FFPL5',
          prize: '$300,000',
          teams: 12,
          matches: 24,
          organizer: 'Garena SEA',
          featured: false
        },
        {
          id: 'tournament_4',
          name: 'Global Series 2024',
          description: 'Série Global de Free Fire 2024',
          status: 'upcoming',
          region: 'global',
          startDate: '2024-02-20T12:00:00Z',
          endDate: '2024-03-15T20:00:00Z',
          logo: 'https://via.placeholder.com/150?text=FFGS2024',
          prize: '$500,000',
          teams: 16,
          matches: 30,
          organizer: 'Garena International',
          featured: true
        },
        {
          id: 'tournament_5',
          name: 'Regional Cup 2023',
          description: 'Copa Regional de Free Fire 2023',
          status: 'completed',
          region: 'europe',
          startDate: '2023-08-05T14:00:00Z',
          endDate: '2023-08-20T19:00:00Z',
          logo: 'https://via.placeholder.com/150?text=FFRC2023',
          prize: '€150,000',
          teams: 10,
          matches: 18,
          organizer: 'Garena Europe',
          featured: false
        }
      ];
      
      // Aplicar filtros simulados
      let filteredTournaments = [...tournaments];
      
      if (status) {
        filteredTournaments = filteredTournaments.filter(tournament => tournament.status === status);
      }
      
      if (region) {
        filteredTournaments = filteredTournaments.filter(tournament => tournament.region === region);
      }
      
      // Aplicar paginação simulada
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedTournaments = filteredTournaments.slice(startIndex, endIndex);
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        count: filteredTournaments.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredTournaments.length / limit),
        data: paginatedTournaments
      });
    } catch (error) {
      logger.error(`Erro ao buscar torneios: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter detalhes de um torneio específico
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getTournamentById(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info(`Buscando detalhes do torneio: ${id}`);
      
      // Simulação de torneio
      // Em um ambiente real, buscaria do banco de dados
      const tournaments = {
        tournament_1: {
          id: 'tournament_1',
          name: 'FFWS 2023 - Grand Finals',
          description: 'Free Fire World Series 2023 - Grand Finals é o maior torneio internacional de Free Fire, reunindo as melhores equipes de todas as regiões para competir pelo título mundial.',
          status: 'ongoing',
          region: 'global',
          startDate: '2023-11-25T12:00:00Z',
          endDate: '2023-12-03T20:00:00Z',
          logo: 'https://via.placeholder.com/300?text=FFWS2023',
          banner: 'https://via.placeholder.com/1200x400?text=FFWS2023',
          prize: '$1,000,000',
          teams: [
            {
              id: 'team_101',
              name: 'Team Alpha 101',
              country: 'Brasil',
              logo: 'https://via.placeholder.com/100?text=T101',
              players: 4,
              groupStage: 'A',
              qualified: true
            },
            {
              id: 'team_102',
              name: 'Team Alpha 102',
              country: 'Argentina',
              logo: 'https://via.placeholder.com/100?text=T102',
              players: 4,
              groupStage: 'A',
              qualified: true
            },
            {
              id: 'team_201',
              name: 'Team Beta 201',
              country: 'Tailândia',
              logo: 'https://via.placeholder.com/100?text=T201',
              players: 4,
              groupStage: 'B',
              qualified: true
            },
            {
              id: 'team_202',
              name: 'Team Beta 202',
              country: 'Indonésia',
              logo: 'https://via.placeholder.com/100?text=T202',
              players: 4,
              groupStage: 'B',
              qualified: true
            }
          ],
          stages: [
            {
              id: 'play_in',
              name: 'Play-In',
              startDate: '2023-11-25T12:00:00Z',
              endDate: '2023-11-26T20:00:00Z',
              status: 'completed',
              format: '6 partidas - pontuação acumulada',
              matches: 6,
              results: [
                { position: 1, teamId: 'team_101', points: 87 },
                { position: 2, teamId: 'team_102', points: 72 },
                { position: 3, teamId: 'team_201', points: 65 },
                { position: 4, teamId: 'team_202', points: 58 }
              ]
            },
            {
              id: 'grand_finals',
              name: 'Grand Finals',
              startDate: '2023-12-02T14:00:00Z',
              endDate: '2023-12-03T20:00:00Z',
              status: 'ongoing',
              format: '6 partidas - pontuação acumulada',
              matches: 6,
              results: []
            }
          ],
          stream: {
            url: 'https://www.youtube.com/watch?v=example',
            platform: 'youtube'
          },
          organizer: 'Garena',
          featured: true,
          nextMatch: {
            id: 'match_1005',
            title: 'Grand Finals - Partida #2',
            startTime: '2023-12-02T16:00:00Z'
          }
        },
        tournament_2: {
          id: 'tournament_2',
          name: 'LBFF 10 - Série A',
          description: 'Liga Brasileira de Free Fire - 10ª Edição da Série A, reunindo as melhores equipes do Brasil em uma competição de alto nível.',
          status: 'upcoming',
          region: 'brazil',
          startDate: '2023-12-15T18:00:00Z',
          endDate: '2024-02-10T21:00:00Z',
          logo: 'https://via.placeholder.com/300?text=LBFF10',
          banner: 'https://via.placeholder.com/1200x400?text=LBFF10',
          prize: 'R$500,000',
          teams: [
            {
              id: 'team_103',
              name: 'Team Alpha 103',
              country: 'Brasil',
              logo: 'https://via.placeholder.com/100?text=T103',
              players: 4,
              groupStage: 'Única',
              qualified: true
            },
            {
              id: 'team_104',
              name: 'Team Alpha 104',
              country: 'Brasil',
              logo: 'https://via.placeholder.com/100?text=T104',
              players: 4,
              groupStage: 'Única',
              qualified: true
            }
          ],
          stages: [
            {
              id: 'regular_season',
              name: 'Temporada Regular',
              startDate: '2023-12-15T18:00:00Z',
              endDate: '2024-01-28T21:00:00Z',
              status: 'upcoming',
              format: '18 dias de competição - 3 partidas por dia',
              matches: 54
            },
            {
              id: 'grand_finals',
              name: 'Grande Final',
              startDate: '2024-02-10T18:00:00Z',
              endDate: '2024-02-10T21:00:00Z',
              status: 'upcoming',
              format: '6 partidas - pontuação acumulada',
              matches: 6
            }
          ],
          stream: {
            url: 'https://www.youtube.com/watch?v=example',
            platform: 'youtube'
          },
          organizer: 'Garena Brasil',
          featured: true,
          nextMatch: {
            id: 'match_2001',
            title: 'Temporada Regular - Dia 1 - Partida #1',
            startTime: '2023-12-15T18:00:00Z'
          }
        }
      };
      
      const tournament = tournaments[id];
      
      // Verificar se o torneio existe
      if (!tournament) {
        return next(ApiError.notFound('Torneio não encontrado'));
      }
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        data: tournament
      });
    } catch (error) {
      logger.error(`Erro ao buscar detalhes do torneio: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter classificação de um torneio específico
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getTournamentStandings(req, res, next) {
    try {
      const { id } = req.params;
      const { stage } = req.query;
      
      logger.info(`Buscando classificação do torneio: ${id}, estágio: ${stage || 'todos'}`);
      
      // Simulação de classificação
      // Em um ambiente real, buscaria do banco de dados
      const tournamentStandings = {
        tournament_1: {
          id: 'tournament_1',
          name: 'FFWS 2023 - Grand Finals',
          standings: {
            play_in: [
              { position: 1, teamId: 'team_101', teamName: 'Team Alpha 101', points: 87, booyahs: 2, kills: 24, matches: 6 },
              { position: 2, teamId: 'team_102', teamName: 'Team Alpha 102', points: 72, booyahs: 1, kills: 21, matches: 6 },
              { position: 3, teamId: 'team_201', teamName: 'Team Beta 201', points: 65, booyahs: 1, kills: 17, matches: 6 },
              { position: 4, teamId: 'team_202', teamName: 'Team Beta 202', points: 58, booyahs: 0, kills: 16, matches: 6 }
            ],
            grand_finals: [
              { position: 1, teamId: 'team_101', teamName: 'Team Alpha 101', points: 35, booyahs: 1, kills: 9, matches: 2 },
              { position: 2, teamId: 'team_201', teamName: 'Team Beta 201', points: 29, booyahs: 0, kills: 8, matches: 2 },
              { position: 3, teamId: 'team_102', teamName: 'Team Alpha 102', points: 25, booyahs: 1, kills: 6, matches: 2 },
              { position: 4, teamId: 'team_202', teamName: 'Team Beta 202', points: 20, booyahs: 0, kills: 5, matches: 2 }
            ]
          }
        },
        tournament_2: {
          id: 'tournament_2',
          name: 'LBFF 10 - Série A',
          standings: {
            regular_season: []
          }
        }
      };
      
      const tournament = tournamentStandings[id];
      
      // Verificar se o torneio existe
      if (!tournament) {
        return next(ApiError.notFound('Torneio não encontrado'));
      }
      
      // Filtrar por estágio se especificado
      let data = tournament.standings;
      if (stage && tournament.standings[stage]) {
        data = { [stage]: tournament.standings[stage] };
      }
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        data: {
          id: tournament.id,
          name: tournament.name,
          standings: data
        }
      });
    } catch (error) {
      logger.error(`Erro ao buscar classificação do torneio: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter partidas de um torneio específico
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getTournamentMatches(req, res, next) {
    try {
      const { id } = req.params;
      const { status, stage, page = 1, limit = 10 } = req.query;
      
      logger.info(`Buscando partidas do torneio: ${id}`);
      
      // Simulação de partidas do torneio
      // Em um ambiente real, buscaria do banco de dados
      const now = new Date();
      const matches = [];
      
      // Gerar partidas simuladas para o torneio
      for (let i = 0; i < 20; i++) {
        const matchId = `match_${1000 + i}`;
        const startTime = new Date(now.getTime() + (i * 3600000)); // cada partida começa 1 hora após a anterior
        const stageId = i < 12 ? 'play_in' : 'grand_finals';
        const stageDay = i < 12 ? Math.floor(i / 6) + 1 : Math.floor((i - 12) / 6) + 1;
        const matchInStage = (i % 6) + 1;
        
        matches.push({
          id: matchId,
          tournamentId: id,
          title: `${stageId === 'play_in' ? 'Play-In' : 'Grand Finals'} - Dia ${stageDay} - Partida #${matchInStage}`,
          stage: stageId,
          startTime: startTime.toISOString(),
          status: i < 5 ? 'completed' : (i < 15 ? 'scheduled' : 'live'),
          teams: [
            {
              id: `team_${100 + (i % 4) + 1}`,
              name: `Team Alpha ${100 + (i % 4) + 1}`
            },
            {
              id: `team_${200 + (i % 4) + 1}`,
              name: `Team Beta ${200 + (i % 4) + 1}`
            }
          ],
          result: i < 5 ? {
            winnerId: `team_${100 + (i % 4) + 1}`,
            score: {
              [`team_${100 + (i % 4) + 1}`]: 35 + Math.floor(Math.random() * 20),
              [`team_${200 + (i % 4) + 1}`]: 20 + Math.floor(Math.random() * 15)
            }
          } : null
        });
      }
      
      // Aplicar filtros simulados
      let filteredMatches = [...matches];
      
      if (status) {
        filteredMatches = filteredMatches.filter(match => match.status === status);
      }
      
      if (stage) {
        filteredMatches = filteredMatches.filter(match => match.stage === stage);
      }
      
      // Aplicar paginação simulada
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedMatches = filteredMatches.slice(startIndex, endIndex);
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        count: filteredMatches.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(filteredMatches.length / limit),
        data: paginatedMatches
      });
    } catch (error) {
      logger.error(`Erro ao buscar partidas do torneio: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new TournamentController(); 