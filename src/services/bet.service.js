const { v4: uuidv4 } = require('uuid');
const Bet = require('../models/bet.model');
const Match = require('../models/match.model');
const User = require('../models/user.model');
const WalletService = require('./wallet.service');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Serviço de apostas - contém a lógica de negócio para gerenciar apostas
 */
class BetService {
  /**
   * Criar uma nova aposta
   * @param {Object} betData - Dados da aposta
   * @param {string} userId - ID do usuário que está apostando
   * @param {string} ipAddress - Endereço IP do usuário
   * @param {string} userAgent - User Agent do navegador do usuário
   * @returns {Promise<Object>} - A aposta criada
   */
  static async createBet(betData, userId, ipAddress = null, userAgent = null) {
    try {
      // Verificar se o usuário existe
      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.notFound('Usuário não encontrado');
      }
      
      // Verificar se a partida existe e está disponível para apostas
      const match = await Match.findById(betData.match);
      if (!match) {
        throw ApiError.notFound('Partida não encontrada');
      }
      
      // Verificar se a partida está aberta para apostas
      if (!match.isBettingOpen()) {
        throw ApiError.badRequest('Apostas fechadas para esta partida');
      }
      
      // Verificar se a partida já começou
      if (match.hasStarted()) {
        throw ApiError.badRequest('Partida já começou, apostas não são mais aceitas');
      }
      
      // Verificar se o valor da aposta está dentro dos limites
      const minBetAmount = parseFloat(process.env.MIN_BET_AMOUNT) || 5;
      const maxBetAmount = parseFloat(process.env.MAX_BET_AMOUNT) || 1000;
      
      if (betData.amount < minBetAmount) {
        throw ApiError.badRequest(`Valor mínimo de aposta é ${minBetAmount}`);
      }
      
      if (betData.amount > maxBetAmount) {
        throw ApiError.badRequest(`Valor máximo de aposta é ${maxBetAmount}`);
      }
      
      // Verificar se o usuário tem saldo suficiente
      if (user.wallet.balance < betData.amount) {
        throw ApiError.badRequest('Saldo insuficiente para realizar esta aposta');
      }
      
      // Verificar e ajustar as odds (para evitar manipulação do cliente)
      let validatedOdds = betData.odds;
      
      if (betData.type === 'match_winner') {
        const teamOdds = match.odds.teams.find(t => t.team_id === betData.selection.team_id);
        if (!teamOdds) {
          throw ApiError.badRequest('Seleção de time inválida');
        }
        validatedOdds = teamOdds.odd;
      } else if (betData.type === 'special_market') {
        const market = match.odds.special_markets.find(m => m.market_id === betData.selection.market_id);
        if (!market) {
          throw ApiError.badRequest('Mercado de aposta inválido');
        }
        
        const option = market.options.find(o => o.option_id === betData.selection.option_id);
        if (!option) {
          throw ApiError.badRequest('Opção de aposta inválida');
        }
        
        validatedOdds = option.odd;
      } else {
        throw ApiError.badRequest('Tipo de aposta inválido');
      }
      
      // Calcular retorno potencial
      const potentialReturn = parseFloat((betData.amount * validatedOdds).toFixed(2));
      
      // Gerar ID único para o bilhete de aposta
      const betSlipId = uuidv4();
      
      // Criar nova aposta
      const newBet = new Bet({
        user: userId,
        match: match._id,
        match_id: match.match_id,
        amount: betData.amount,
        type: betData.type,
        selection: betData.selection,
        odds: validatedOdds,
        potential_return: potentialReturn,
        bet_slip_id: betSlipId,
        ip_address: ipAddress,
        user_agent: userAgent,
        source: betData.source || 'web'
      });
      
      // Debitar valor da aposta da carteira do usuário
      await WalletService.debitFromWallet(userId, betData.amount, 'bet', {
        bet_slip_id: betSlipId,
        match_id: match.match_id
      });
      
      // Salvar aposta
      await newBet.save();
      
      // Atualizar estatísticas da partida
      match.total_bets += 1;
      match.total_bet_amount += betData.amount;
      await match.save();
      
      // Atualizar estatísticas do usuário
      user.stats.total_bets += 1;
      await user.save();
      
      logger.info(`Nova aposta criada: ${betSlipId} por usuário ${userId}`);
      
      return newBet;
    } catch (error) {
      logger.error(`Erro ao criar aposta: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Buscar apostas de um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} filters - Filtros para a busca (status, etc)
   * @param {number} page - Página atual para paginação
   * @param {number} limit - Limite de itens por página
   * @returns {Promise<Object>} - Lista de apostas paginadas
   */
  static async getUserBets(userId, filters = {}, page = 1, limit = 10) {
    try {
      const query = { user: userId };
      
      // Aplicar filtros adicionais
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.match) {
        query.match = filters.match;
      }
      
      if (filters.type) {
        query.type = filters.type;
      }
      
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        
        if (filters.dateFrom) {
          query.createdAt.$gte = new Date(filters.dateFrom);
        }
        
        if (filters.dateTo) {
          query.createdAt.$lte = new Date(filters.dateTo);
        }
      }
      
      // Contar total para paginação
      const total = await Bet.countDocuments(query);
      
      // Calcular skip para paginação
      const skip = (page - 1) * limit;
      
      // Buscar apostas com paginação e populate
      const bets = await Bet.find(query)
        .populate('match', 'match_id title tournament_name start_time status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      return {
        bets,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Erro ao buscar apostas do usuário: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Buscar uma aposta pelo ID
   * @param {string} betId - ID da aposta
   * @returns {Promise<Object>} - A aposta encontrada
   */
  static async getBetById(betId) {
    try {
      const bet = await Bet.findById(betId)
        .populate('user', 'username email profile.name')
        .populate('match', 'match_id title tournament_name start_time status');
      
      if (!bet) {
        throw ApiError.notFound('Aposta não encontrada');
      }
      
      return bet;
    } catch (error) {
      logger.error(`Erro ao buscar aposta: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Processar resultado de uma partida e liquidar apostas
   * @param {string} matchId - ID da partida
   * @returns {Promise<Object>} - Resumo do processamento
   */
  static async processMatchResults(matchId) {
    try {
      // Buscar a partida
      const match = await Match.findById(matchId);
      if (!match) {
        throw ApiError.notFound('Partida não encontrada');
      }
      
      // Verificar se a partida está concluída
      if (match.status !== 'completed') {
        throw ApiError.badRequest('Partida ainda não foi concluída');
      }
      
      // Verificar se a partida tem resultado
      if (!match.result || !match.result.winner_team_id) {
        throw ApiError.badRequest('Partida não possui resultado definido');
      }
      
      // Buscar todas as apostas pendentes para esta partida
      const pendingBets = await Bet.find({
        match: matchId,
        status: 'pending'
      });
      
      logger.info(`Processando ${pendingBets.length} apostas para partida ${match.match_id}`);
      
      // Contadores para estatísticas
      const stats = {
        total: pendingBets.length,
        won: 0,
        lost: 0,
        void: 0,
        processed: 0,
        totalPayouts: 0
      };
      
      // Processar cada aposta
      for (const bet of pendingBets) {
        try {
          // Liquidar a aposta com o resultado da partida
          await bet.settle(match.result);
          
          // Atualizar estatísticas
          stats.processed++;
          
          if (bet.status === 'won') {
            stats.won++;
            stats.totalPayouts += bet.potential_return;
            
            // Creditar ganhos na carteira do usuário
            await WalletService.creditToWallet(bet.user, bet.potential_return, 'bet_win', {
              bet_slip_id: bet.bet_slip_id,
              match_id: match.match_id
            });
            
            // Atualizar estatísticas do usuário
            const user = await User.findById(bet.user);
            if (user) {
              user.stats.won_bets += 1;
              await user.updateStats();
            }
            
            logger.info(`Aposta ${bet.bet_slip_id} vencida, pagamento de ${bet.potential_return} processado`);
          } else if (bet.status === 'lost') {
            stats.lost++;
            logger.info(`Aposta ${bet.bet_slip_id} perdida`);
          } else if (bet.status === 'void') {
            stats.void++;
            
            // Reembolsar valor da aposta
            await WalletService.creditToWallet(bet.user, bet.amount, 'bet_refund', {
              bet_slip_id: bet.bet_slip_id,
              match_id: match.match_id,
              reason: 'void'
            });
            
            logger.info(`Aposta ${bet.bet_slip_id} anulada, reembolso de ${bet.amount} processado`);
          }
        } catch (error) {
          logger.error(`Erro ao processar aposta ${bet._id}: ${error.message}`);
        }
      }
      
      // Atualizar status da partida
      match.betting_status = 'settled';
      await match.save();
      
      logger.info(`Processamento concluído para partida ${match.match_id}`, stats);
      
      return {
        matchId: match._id,
        matchTitle: match.title,
        stats
      };
    } catch (error) {
      logger.error(`Erro ao processar resultados da partida: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Cancelar uma aposta
   * @param {string} betId - ID da aposta
   * @param {string} reason - Motivo do cancelamento
   * @returns {Promise<Object>} - A aposta cancelada
   */
  static async cancelBet(betId, reason) {
    try {
      const bet = await Bet.findById(betId);
      if (!bet) {
        throw ApiError.notFound('Aposta não encontrada');
      }
      
      // Verificar se a aposta pode ser cancelada
      if (bet.status !== 'pending') {
        throw ApiError.badRequest('Apenas apostas pendentes podem ser canceladas');
      }
      
      // Buscar a partida
      const match = await Match.findById(bet.match);
      if (match && match.status !== 'upcoming') {
        throw ApiError.badRequest('Não é possível cancelar apostas de partidas que já começaram');
      }
      
      // Cancelar a aposta
      await bet.cancel(reason);
      
      // Reembolsar valor da aposta
      await WalletService.creditToWallet(bet.user, bet.amount, 'bet_cancel', {
        bet_slip_id: bet.bet_slip_id,
        match_id: bet.match_id,
        reason
      });
      
      logger.info(`Aposta ${bet.bet_slip_id} cancelada: ${reason}`);
      
      return bet;
    } catch (error) {
      logger.error(`Erro ao cancelar aposta: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Anular múltiplas apostas por partida
   * @param {string} matchId - ID da partida
   * @param {string} reason - Motivo da anulação
   * @returns {Promise<Object>} - Resumo da operação
   */
  static async voidBetsByMatch(matchId, reason) {
    try {
      // Buscar a partida
      const match = await Match.findById(matchId);
      if (!match) {
        throw ApiError.notFound('Partida não encontrada');
      }
      
      // Buscar todas as apostas pendentes para esta partida
      const pendingBets = await Bet.find({
        match: matchId,
        status: 'pending'
      });
      
      logger.info(`Anulando ${pendingBets.length} apostas para partida ${match.match_id}`);
      
      // Contador para estatísticas
      let processedCount = 0;
      
      // Processar cada aposta
      for (const bet of pendingBets) {
        try {
          // Anular a aposta
          bet.status = 'void';
          bet.settlement_data = {
            timestamp: new Date(),
            result_details: { reason },
            payout_amount: bet.amount,
            payout_status: 'pending'
          };
          await bet.save();
          
          // Reembolsar valor da aposta
          await WalletService.creditToWallet(bet.user, bet.amount, 'bet_void', {
            bet_slip_id: bet.bet_slip_id,
            match_id: match.match_id,
            reason
          });
          
          processedCount++;
        } catch (error) {
          logger.error(`Erro ao anular aposta ${bet._id}: ${error.message}`);
        }
      }
      
      // Atualizar status da partida
      match.betting_status = 'settled';
      match.status = 'canceled';
      await match.save();
      
      logger.info(`Anulação concluída para partida ${match.match_id}: ${processedCount} apostas processadas`);
      
      return {
        matchId: match._id,
        matchTitle: match.title,
        totalBets: pendingBets.length,
        processedBets: processedCount,
        reason
      };
    } catch (error) {
      logger.error(`Erro ao anular apostas por partida: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BetService; 