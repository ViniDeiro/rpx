/**
 * Controlador de partidas
 * Responsável por gerenciar as partidas de Free Fire disponíveis para apostas
 */

const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');
const Match = require('../models/match.model');
const User = require('../models/user.model');
const NotificationService = require('../utils/notificationService');

class MatchController {
  /**
   * Obter todas as partidas disponíveis
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getAllMatches(req, res, next) {
    try {
      // Simulação de parâmetros de filtro e paginação
      const { status, tournament, team, page = 1, limit = 10 } = req.query;
      
      logger.info('Buscando lista de partidas disponíveis');
      
      // Simulação de dados de partidas
      // Em um ambiente real, buscaria do banco de dados com filtros
      const matches = [];
      
      // Gerar 20 partidas simuladas
      for (let i = 0; i < 20; i++) {
        const matchId = `match_${1000 + i}`;
        const now = new Date();
        const startTime = new Date(now.getTime() + (i * 3600000)); // cada partida começa 1 hora após a anterior
        
        matches.push({
          id: matchId,
          title: `Partida #${1000 + i} - Fase de Grupos`,
          tournament: {
            id: 'tournament_1',
            name: 'FFWS 2023 - Grand Finals'
          },
          teams: [
            {
              id: `team_${100 + (i % 5)}`,
              name: `Time Alpha ${100 + (i % 5)}`,
              logo: `https://via.placeholder.com/50?text=T${100 + (i % 5)}`,
              odds: 1.5 + (Math.random() * 0.5)
            },
            {
              id: `team_${200 + (i % 5)}`,
              name: `Time Beta ${200 + (i % 5)}`,
              logo: `https://via.placeholder.com/50?text=T${200 + (i % 5)}`,
              odds: 1.5 + (Math.random() * 0.5)
            }
          ],
          startTime: startTime.toISOString(),
          status: i < 5 ? 'completed' : (i < 15 ? 'scheduled' : 'live'),
          result: i < 5 ? {
            winnerId: `team_${100 + (i % 5)}`,
            score: {
              [`team_${100 + (i % 5)}`]: 35 + Math.floor(Math.random() * 20),
              [`team_${200 + (i % 5)}`]: 20 + Math.floor(Math.random() * 15)
            }
          } : null,
          markets: [
            {
              id: `market_${matchId}_winner`,
              name: 'Vencedor da Partida',
              type: 'match_winner',
              options: [
                {
                  id: `option_${matchId}_team1`,
                  name: `Time Alpha ${100 + (i % 5)}`,
                  odds: 1.5 + (Math.random() * 0.5)
                },
                {
                  id: `option_${matchId}_team2`,
                  name: `Time Beta ${200 + (i % 5)}`,
                  odds: 1.5 + (Math.random() * 0.5)
                }
              ]
            },
            {
              id: `market_${matchId}_firstblood`,
              name: 'Primeiro Abate',
              type: 'special_market',
              options: [
                {
                  id: `option_${matchId}_team1_fb`,
                  name: `Time Alpha ${100 + (i % 5)}`,
                  odds: 1.8 + (Math.random() * 0.4)
                },
                {
                  id: `option_${matchId}_team2_fb`,
                  name: `Time Beta ${200 + (i % 5)}`,
                  odds: 1.8 + (Math.random() * 0.4)
                }
              ]
            }
          ]
        });
      }
      
      // Aplicar filtros simulados
      let filteredMatches = [...matches];
      
      if (status) {
        filteredMatches = filteredMatches.filter(match => match.status === status);
      }
      
      if (tournament) {
        filteredMatches = filteredMatches.filter(match => match.tournament.id === tournament);
      }
      
      if (team) {
        filteredMatches = filteredMatches.filter(match => 
          match.teams.some(t => t.id === team)
        );
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
      logger.error(`Erro ao buscar partidas: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter detalhes de uma partida específica
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getMatchById(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info(`Buscando detalhes da partida: ${id}`);
      
      // Simulação de partida
      // Em um ambiente real, buscaria do banco de dados
      const matchId = id;
      const now = new Date();
      const i = parseInt(matchId.split('_')[1]) - 1000;
      const startTime = new Date(now.getTime() + (i * 3600000));
      
      const match = {
        id: matchId,
        title: `Partida #${1000 + i} - Fase de Grupos`,
        tournament: {
          id: 'tournament_1',
          name: 'FFWS 2023 - Grand Finals'
        },
        teams: [
          {
            id: `team_${100 + (i % 5)}`,
            name: `Time Alpha ${100 + (i % 5)}`,
            logo: `https://via.placeholder.com/50?text=T${100 + (i % 5)}`,
            odds: 1.5 + (Math.random() * 0.5),
            players: [
              { id: `player_${1001 + i}`, name: `Player A${i}1`, role: 'Rusher' },
              { id: `player_${1002 + i}`, name: `Player A${i}2`, role: 'Sniper' },
              { id: `player_${1003 + i}`, name: `Player A${i}3`, role: 'Support' },
              { id: `player_${1004 + i}`, name: `Player A${i}4`, role: 'Leader' }
            ]
          },
          {
            id: `team_${200 + (i % 5)}`,
            name: `Time Beta ${200 + (i % 5)}`,
            logo: `https://via.placeholder.com/50?text=T${200 + (i % 5)}`,
            odds: 1.5 + (Math.random() * 0.5),
            players: [
              { id: `player_${2001 + i}`, name: `Player B${i}1`, role: 'Rusher' },
              { id: `player_${2002 + i}`, name: `Player B${i}2`, role: 'Sniper' },
              { id: `player_${2003 + i}`, name: `Player B${i}3`, role: 'Support' },
              { id: `player_${2004 + i}`, name: `Player B${i}4`, role: 'Leader' }
            ]
          }
        ],
        startTime: startTime.toISOString(),
        status: i < 5 ? 'completed' : (i < 15 ? 'scheduled' : 'live'),
        result: i < 5 ? {
          winnerId: `team_${100 + (i % 5)}`,
          score: {
            [`team_${100 + (i % 5)}`]: 35 + Math.floor(Math.random() * 20),
            [`team_${200 + (i % 5)}`]: 20 + Math.floor(Math.random() * 15)
          },
          kills: {
            [`team_${100 + (i % 5)}`]: 12 + Math.floor(Math.random() * 8),
            [`team_${200 + (i % 5)}`]: 8 + Math.floor(Math.random() * 6)
          },
          mvp: {
            playerId: `player_${1001 + i}`,
            name: `Player A${i}1`,
            kills: 5 + Math.floor(Math.random() * 4),
            damage: 1200 + Math.floor(Math.random() * 800)
          }
        } : null,
        markets: [
          {
            id: `market_${matchId}_winner`,
            name: 'Vencedor da Partida',
            type: 'match_winner',
            options: [
              {
                id: `option_${matchId}_team1`,
                name: `Time Alpha ${100 + (i % 5)}`,
                odds: 1.5 + (Math.random() * 0.5)
              },
              {
                id: `option_${matchId}_team2`,
                name: `Time Beta ${200 + (i % 5)}`,
                odds: 1.5 + (Math.random() * 0.5)
              }
            ]
          },
          {
            id: `market_${matchId}_firstblood`,
            name: 'Primeiro Abate',
            type: 'special_market',
            options: [
              {
                id: `option_${matchId}_team1_fb`,
                name: `Time Alpha ${100 + (i % 5)}`,
                odds: 1.8 + (Math.random() * 0.4)
              },
              {
                id: `option_${matchId}_team2_fb`,
                name: `Time Beta ${200 + (i % 5)}`,
                odds: 1.8 + (Math.random() * 0.4)
              }
            ]
          },
          {
            id: `market_${matchId}_total_kills`,
            name: 'Total de Abates',
            type: 'special_market',
            options: [
              {
                id: `option_${matchId}_kills_over20`,
                name: 'Mais de 20 abates',
                odds: 1.6 + (Math.random() * 0.3)
              },
              {
                id: `option_${matchId}_kills_under20`,
                name: 'Menos de 20 abates',
                odds: 2.1 + (Math.random() * 0.4)
              }
            ]
          }
        ],
        timeline: i < 5 ? [
          { time: '00:01:45', event: 'first_blood', teamId: `team_${100 + (i % 5)}`, playerId: `player_${1001 + i}` },
          { time: '00:03:22', event: 'zone_shrink', description: 'Primeira zona fechando' },
          { time: '00:05:48', event: 'team_eliminated', teamId: `team_${200 + (i % 5)}` },
          { time: '00:08:15', event: 'match_end', winnerId: `team_${100 + (i % 5)}` }
        ] : [],
        stream: {
          url: 'https://www.youtube.com/watch?v=example',
          platform: 'youtube',
          startTime: startTime.toISOString()
        }
      };
      
      // Verificar se a partida existe
      if (!match) {
        return next(ApiError.notFound('Partida não encontrada'));
      }
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        data: match
      });
    } catch (error) {
      logger.error(`Erro ao buscar detalhes da partida: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter mercados de apostas para uma partida específica
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getMatchMarkets(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info(`Buscando mercados de apostas para partida: ${id}`);
      
      // Simulação de mercados
      // Em um ambiente real, buscaria do banco de dados
      const i = parseInt(id.split('_')[1]) - 1000;
      
      const markets = [
        {
          id: `market_${id}_winner`,
          name: 'Vencedor da Partida',
          type: 'match_winner',
          description: 'Aposte no time que vencerá a partida',
          status: 'open',
          options: [
            {
              id: `option_${id}_team1`,
              name: `Time Alpha ${100 + (i % 5)}`,
              odds: 1.5 + (Math.random() * 0.5),
              probability: '65%'
            },
            {
              id: `option_${id}_team2`,
              name: `Time Beta ${200 + (i % 5)}`,
              odds: 1.5 + (Math.random() * 0.5),
              probability: '35%'
            }
          ]
        },
        {
          id: `market_${id}_firstblood`,
          name: 'Primeiro Abate',
          type: 'special_market',
          description: 'Aposte no time que conseguirá o primeiro abate da partida',
          status: 'open',
          options: [
            {
              id: `option_${id}_team1_fb`,
              name: `Time Alpha ${100 + (i % 5)}`,
              odds: 1.8 + (Math.random() * 0.4),
              probability: '55%'
            },
            {
              id: `option_${id}_team2_fb`,
              name: `Time Beta ${200 + (i % 5)}`,
              odds: 1.8 + (Math.random() * 0.4),
              probability: '45%'
            }
          ]
        },
        {
          id: `market_${id}_total_kills`,
          name: 'Total de Abates',
          type: 'special_market',
          description: 'Aposte no total de abates da partida',
          status: 'open',
          options: [
            {
              id: `option_${id}_kills_over20`,
              name: 'Mais de 20 abates',
              odds: 1.6 + (Math.random() * 0.3),
              probability: '60%'
            },
            {
              id: `option_${id}_kills_under20`,
              name: 'Menos de 20 abates',
              odds: 2.1 + (Math.random() * 0.4),
              probability: '40%'
            }
          ]
        },
        {
          id: `market_${id}_mvp`,
          name: 'MVP da Partida',
          type: 'special_market',
          description: 'Aposte no jogador que será o MVP da partida',
          status: 'open',
          options: [
            {
              id: `option_${id}_mvp_1`,
              name: `Player A${i}1`,
              odds: 3.5 + (Math.random() * 1.0),
              probability: '25%'
            },
            {
              id: `option_${id}_mvp_2`,
              name: `Player A${i}4`,
              odds: 4.0 + (Math.random() * 1.5),
              probability: '20%'
            },
            {
              id: `option_${id}_mvp_3`,
              name: `Player B${i}1`,
              odds: 4.5 + (Math.random() * 1.5),
              probability: '18%'
            },
            {
              id: `option_${id}_mvp_4`,
              name: `Player B${i}3`,
              odds: 5.0 + (Math.random() * 2.0),
              probability: '15%'
            }
          ]
        }
      ];
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        count: markets.length,
        data: markets
      });
    } catch (error) {
      logger.error(`Erro ao buscar mercados de apostas: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter estatísticas ao vivo de uma partida (somente para partidas ao vivo)
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getLiveStats(req, res, next) {
    try {
      const { id } = req.params;
      
      logger.info(`Buscando estatísticas ao vivo para partida: ${id}`);
      
      // Simulação de partida
      const i = parseInt(id.split('_')[1]) - 1000;
      const isLive = i >= 15;
      
      if (!isLive) {
        return next(ApiError.badRequest('Esta partida não está ao vivo'));
      }
      
      // Simulação de estatísticas ao vivo
      const liveStats = {
        matchId: id,
        currentTime: '00:05:32',
        zone: 'Fechando para a segunda zona',
        teamsRemaining: 8,
        teams: [
          {
            id: `team_${100 + (i % 5)}`,
            name: `Time Alpha ${100 + (i % 5)}`,
            status: 'active',
            position: 1,
            kills: 5,
            playersAlive: 4,
            players: [
              { id: `player_${1001 + i}`, name: `Player A${i}1`, kills: 2, status: 'alive' },
              { id: `player_${1002 + i}`, name: `Player A${i}2`, kills: 1, status: 'alive' },
              { id: `player_${1003 + i}`, name: `Player A${i}3`, kills: 2, status: 'alive' },
              { id: `player_${1004 + i}`, name: `Player A${i}4`, kills: 0, status: 'alive' }
            ]
          },
          {
            id: `team_${200 + (i % 5)}`,
            name: `Time Beta ${200 + (i % 5)}`,
            status: 'active',
            position: 3,
            kills: 3,
            playersAlive: 3,
            players: [
              { id: `player_${2001 + i}`, name: `Player B${i}1`, kills: 1, status: 'alive' },
              { id: `player_${2002 + i}`, name: `Player B${i}2`, kills: 0, status: 'dead' },
              { id: `player_${2003 + i}`, name: `Player B${i}3`, kills: 2, status: 'alive' },
              { id: `player_${2004 + i}`, name: `Player B${i}4`, kills: 0, status: 'alive' }
            ]
          }
        ],
        events: [
          { time: '00:01:23', type: 'kill', killer: `Player A${i}1`, victim: `Player C${i}2` },
          { time: '00:02:15', type: 'kill', killer: `Player B${i}3`, victim: `Player D${i}1` },
          { time: '00:03:42', type: 'kill', killer: `Player A${i}3`, victim: `Player E${i}4` },
          { time: '00:04:18', type: 'zone_damage', victim: `Player B${i}2`, result: 'eliminated' },
          { time: '00:05:07', type: 'kill', killer: `Player A${i}1`, victim: `Player F${i}3` }
        ],
        updatedAt: new Date().toISOString()
      };
      
      // Enviar resposta de sucesso
      res.status(200).json({
        success: true,
        data: liveStats
      });
    } catch (error) {
      logger.error(`Erro ao buscar estatísticas ao vivo: ${error.message}`);
      next(error);
    }
  }

  /**
   * Enviar convite para participar de uma partida
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async sendMatchInvitation(req, res, next) {
    try {
      const inviterId = req.user._id;
      const { matchId, userIds, message } = req.body;
      
      if (!matchId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return next(ApiError.badRequest('ID da partida e IDs dos usuários são obrigatórios'));
      }
      
      logger.info(`Enviando convites para partida ${matchId} por ${inviterId}`);
      
      // Verificar se a partida existe
      const match = await Match.findById(matchId);
      if (!match) {
        return next(ApiError.notFound('Partida não encontrada'));
      }
      
      // Verificar se o usuário que envia é o proprietário da partida
      if (match.creator && match.creator.toString() !== inviterId.toString()) {
        return next(ApiError.forbidden('Apenas o criador da partida pode enviar convites'));
      }
      
      // Verificar status da partida
      if (match.status !== 'upcoming') {
        return next(ApiError.badRequest('Só é possível enviar convites para partidas futuras'));
      }
      
      // Verificar se os usuários existem
      const users = await User.find({ _id: { $in: userIds } }).select('_id username');
      if (users.length === 0) {
        return next(ApiError.badRequest('Nenhum usuário válido encontrado'));
      }
      
      const validUserIds = users.map(user => user._id.toString());
      const sentInvitations = [];
      const failedInvitations = [];
      
      // Enviar convites para cada usuário
      for (const userId of validUserIds) {
        try {
          // Enviar notificação de convite
          await NotificationService.sendMatchInvitation(
            userId,
            matchId,
            inviterId
          );
          
          sentInvitations.push(userId);
          logger.info(`Convite para partida enviado com sucesso para ${userId}`);
        } catch (error) {
          failedInvitations.push({
            userId,
            error: error.message
          });
          logger.error(`Erro ao enviar convite para ${userId}: ${error.message}`);
        }
      }
      
      // Enviar resposta
      return res.status(200).json({
        success: true,
        message: 'Processamento de convites concluído',
        data: {
          matchId,
          sent: sentInvitations,
          failed: failedInvitations,
          totalSent: sentInvitations.length,
          totalFailed: failedInvitations.length
        }
      });
    } catch (error) {
      logger.error(`Erro ao enviar convites para partida: ${error.message}`);
      next(error);
    }
  }
  
  /**
   * Notificar usuários sobre partida próxima
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async notifyUpcomingMatch(req, res, next) {
    try {
      // Verificar permissões - apenas admin ou sistema
      if (!req.user.isAdmin && !req.isSystem) {
        throw new ApiError(403, 'Permissão negada');
      }
      
      const { matchId } = req.params;
      
      // Verificar se a partida existe
      const match = await Match.findById(matchId);
      if (!match) {
        return next(ApiError.notFound('Partida não encontrada'));
      }
      
      // Verificar se a partida está próxima
      const now = new Date();
      const startTime = new Date(match.startTime);
      const timeUntilStart = startTime - now;
      
      // Verificar se a partida está dentro de um limite razoável (1 hora)
      if (timeUntilStart < 0 || timeUntilStart > 3600000) {
        return next(ApiError.badRequest('Esta partida não está prestes a começar'));
      }
      
      // Obter todos os usuários que apostaram nesta partida ou foram convidados
      const interestedUsers = await getInterestedUsers(matchId);
      
      if (interestedUsers.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nenhum usuário interessado encontrado para notificar',
          data: { count: 0 }
        });
      }
      
      // Calcular quantos minutos faltam
      const minutesToStart = Math.round(timeUntilStart / 60000);
      
      // Enviar notificações em lote
      const result = await NotificationService.sendToMany({
        userIds: interestedUsers,
        type: 'match_reminder',
        title: 'Partida prestes a começar',
        message: `A partida "${match.title}" começará em ${minutesToStart} minutos! Não perca!`,
        priority: 'high',
        action: {
          type: 'navigate',
          target: `/matches/${matchId}`
        },
        references: {
          match: matchId
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Notificações enviadas com sucesso',
        data: {
          matchId,
          usersNotified: result.totalSent,
          minutesToStart
        }
      });
    } catch (error) {
      logger.error(`Erro ao notificar sobre partida próxima: ${error.message}`);
      next(error);
    }
  }
  
  /**
   * Notificar sobre resultados de partida
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async notifyMatchResults(req, res, next) {
    try {
      // Verificar permissões - apenas admin ou sistema
      if (!req.user.isAdmin && !req.isSystem) {
        throw new ApiError(403, 'Permissão negada');
      }
      
      const { matchId } = req.params;
      
      // Verificar se a partida existe
      const match = await Match.findById(matchId);
      if (!match) {
        return next(ApiError.notFound('Partida não encontrada'));
      }
      
      // Verificar se a partida está concluída e tem resultados
      if (match.status !== 'completed' || !match.result || !match.result.winner_team_id) {
        return next(ApiError.badRequest('Esta partida não está concluída ou não tem resultados'));
      }
      
      // Obter todos os usuários que apostaram nesta partida ou foram convidados
      const interestedUsers = await getInterestedUsers(matchId);
      
      if (interestedUsers.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nenhum usuário interessado encontrado para notificar',
          data: { count: 0 }
        });
      }
      
      // Obter nome da equipe vencedora
      const winnerTeam = match.teams.find(team => team.id === match.result.winner_team_id);
      const winnerName = winnerTeam ? winnerTeam.name : 'Equipe vencedora';
      
      // Enviar notificações em lote
      const result = await NotificationService.sendToMany({
        userIds: interestedUsers,
        type: 'match_result',
        title: 'Resultado da partida',
        message: `A partida "${match.title}" terminou! ${winnerName} venceu! Confira os detalhes completos.`,
        priority: 'normal',
        action: {
          type: 'navigate',
          target: `/matches/${matchId}`
        },
        references: {
          match: matchId
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Notificações de resultado enviadas com sucesso',
        data: {
          matchId,
          usersNotified: result.totalSent,
          winnerTeam: winnerName
        }
      });
    } catch (error) {
      logger.error(`Erro ao notificar resultados de partida: ${error.message}`);
      next(error);
    }
  }
}

/**
 * Obter todos os usuários interessados em uma partida
 * @param {string} matchId - ID da partida
 * @returns {Promise<Array<string>>} - Array de IDs de usuários
 */
async function getInterestedUsers(matchId) {
  // Implementação fictícia - em uma aplicação real, isso consultaria o banco de dados
  // para encontrar usuários que apostaram na partida ou foram convidados
  
  // 1. Usuários que apostaram na partida
  const betUsers = await Bet.find({ match: matchId }).distinct('user');
  
  // 2. Usuários que foram convidados para a partida
  const invitedUsers = await MatchInvitation.find({ match: matchId }).distinct('user');
  
  // 3. Combinar e remover duplicatas
  const allUsers = [...betUsers, ...invitedUsers];
  const uniqueUsers = [...new Set(allUsers.map(id => id.toString()))];
  
  return uniqueUsers;
}

module.exports = new MatchController(); 