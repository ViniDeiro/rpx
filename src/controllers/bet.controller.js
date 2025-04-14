const BetService = require('../services/bet.service');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const Bet = require('../models/bet.model');
const Match = require('../models/match.model');
const Wallet = require('../models/wallet.model');
const User = require('../models/user.model');
const { generateBetSlipId } = require('../utils/idGenerator');
const mongoose = require('mongoose');
const NotificationService = require('../utils/notificationService');

/**
 * Controlador para gerenciamento de apostas
 */
class BetController {
  /**
   * Criar uma nova aposta
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async createBet(req, res, next) {
    // Iniciar sessão MongoDB para transação
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const userId = req.user.id;
      const { match_id, amount, type, selection } = req.body;
      
      // Validar dados básicos
      if (!match_id || !amount || !type || !selection) {
        throw new ApiError(400, 'Dados insuficientes para criar aposta');
      }
      
      if (amount < 5) {
        throw new ApiError(400, 'O valor mínimo para apostas é de 5');
      }
      
      // Validar tipo de aposta
      if (!['match_winner', 'special_market'].includes(type)) {
        throw new ApiError(400, 'Tipo de aposta inválido');
      }
      
      // Buscar partida
      const match = await Match.findById(match_id).session(session);
      if (!match) {
        throw new ApiError(404, 'Partida não encontrada');
      }
      
      // Verificar se apostas estão abertas
      if (match.betting_status !== 'open') {
        throw new ApiError(400, 'As apostas estão fechadas para esta partida');
      }
      
      // Verificar se a partida já começou
      if (match.status !== 'upcoming') {
        throw new ApiError(400, 'Não é possível apostar em partidas que já começaram');
      }
      
      // Obter carteira do usuário
      const wallet = await Wallet.findByUser(userId).session(session);
      if (!wallet) {
        throw new ApiError(404, 'Carteira não encontrada');
      }
      
      // Verificar se a carteira está bloqueada
      if (wallet.is_locked) {
        throw new ApiError(403, `Sua carteira está bloqueada: ${wallet.lock_reason}`);
      }
      
      // Verificar saldo
      if (wallet.balance < amount) {
        throw new ApiError(400, 'Saldo insuficiente');
      }
      
      // Determinar as odds com base no tipo de aposta
      let odds = 0;
      
      if (type === 'match_winner') {
        // Verificar se a seleção (team_id) é válida
        if (!selection.team_id) {
          throw new ApiError(400, 'É necessário selecionar uma equipe');
        }
        
        // Buscar as odds da equipe selecionada
        const teamOdds = match.odds.teams.find(t => t.team_id === selection.team_id);
        if (!teamOdds) {
          throw new ApiError(400, 'Equipe selecionada não encontrada na partida');
        }
        
        odds = teamOdds.odd;
      } else if (type === 'special_market') {
        // Verificar se os IDs de mercado e opção são válidos
        if (!selection.market_id || !selection.option_id) {
          throw new ApiError(400, 'É necessário selecionar um mercado e uma opção');
        }
        
        // Buscar o mercado especial selecionado
        const marketOdds = match.odds.special_markets.find(m => m.market_id === selection.market_id);
        if (!marketOdds) {
          throw new ApiError(400, 'Mercado especial não encontrado');
        }
        
        // Buscar a opção selecionada dentro do mercado
        const optionOdds = marketOdds.options.find(o => o.option_id === selection.option_id);
        if (!optionOdds) {
          throw new ApiError(400, 'Opção não encontrada no mercado selecionado');
        }
        
        odds = optionOdds.odd;
      }
      
      // Calcular retorno potencial
      const potentialReturn = parseFloat((amount * odds).toFixed(2));
      
      // Gerar ID único para a aposta
      const bet_slip_id = await generateBetSlipId();
      
      // Criar nova aposta
      const newBet = new Bet({
        user: userId,
        match: match_id,
        match_id: match.match_id,
        amount,
        type,
        selection,
        odds,
        potential_return: potentialReturn,
        bet_slip_id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        source: req.headers['user-agent']?.includes('Mobile') ? 'mobile_app' : 'web'
      });
      
      await newBet.save({ session });
      
      // Criar transação na carteira
      await wallet.createTransaction({
        amount,
        type: 'bet_placed',
        status: 'completed',
        description: `Aposta em ${match.title}`,
        reference: `BET-${bet_slip_id}`,
        metadata: {
          bet_id: newBet._id,
          match_id: match._id
        }
      });
      
      // Atualizar estatísticas da partida
      match.total_bets += 1;
      match.total_bet_amount += amount;
      await match.save({ session });
      
      // Confirmar transação
      await session.commitTransaction();
      
      // Log da aposta realizada
      logger.info(`Nova aposta realizada`, { 
        userId, 
        matchId: match._id, 
        amount, 
        type,
        odds,
        potentialReturn
      });
      
      res.status(201).json({
        success: true,
        message: 'Aposta realizada com sucesso',
        data: {
          id: newBet._id,
          bet_slip_id: newBet.bet_slip_id,
          match: {
            id: match._id,
            title: match.title,
            start_time: match.start_time
          },
          amount,
          odds,
          potential_return: potentialReturn,
          type,
          selection,
          status: 'pending',
          placed_at: newBet.createdAt
        }
      });
    } catch (error) {
      // Abortar transação em caso de erro
      await session.abortTransaction();
      
      logger.error(`Erro ao criar aposta: ${error.message}`, { 
        userId: req.user?.id, 
        matchId: req.body?.match_id,
        error
      });
      
      next(error);
    } finally {
      // Finalizar sessão
      session.endSession();
    }
  }
  
  /**
   * Obter apostas do usuário
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async getUserBets(req, res, next) {
    try {
      const userId = req.user.id;
      const { status, limit = 10, skip = 0, matchId } = req.query;
      
      // Opções de filtro
      const options = {
        limit: parseInt(limit),
        skip: parseInt(skip),
        status,
        matchId
      };
      
      // Buscar apostas do usuário
      const bets = await Bet.findByUser(userId, options);
      
      // Formatar apostas para a resposta
      const formattedBets = bets.map(bet => ({
        id: bet._id,
        bet_slip_id: bet.bet_slip_id,
        match: {
          id: bet.match._id,
          title: bet.match.title,
          start_time: bet.match.start_time,
          status: bet.match.status
        },
        amount: bet.amount,
        odds: bet.odds,
        potential_return: bet.potential_return,
        type: bet.type,
        selection: bet.selection,
        status: bet.status,
        placed_at: bet.createdAt,
        result: bet.settlement_data ? {
          settled_at: bet.settlement_data.timestamp,
          payout_amount: bet.settlement_data.payout_amount,
          payout_status: bet.settlement_data.payout_status
        } : null
      }));
      
      res.status(200).json({
        success: true,
        data: formattedBets
      });
    } catch (error) {
      logger.error(`Erro ao obter apostas do usuário: ${error.message}`, { userId: req.user.id, error });
      next(error);
    }
  }
  
  /**
   * Obter detalhes de uma aposta específica
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async getBetDetails(req, res, next) {
    try {
      const userId = req.user.id;
      const betId = req.params.id;
      
      // Buscar aposta específica
      const bet = await Bet.findById(betId)
        .populate('match', 'title start_time status teams odds result tournament_name')
        .populate('user', 'username name');
        
      if (!bet) {
        throw new ApiError(404, 'Aposta não encontrada');
      }
      
      // Verificar se a aposta pertence ao usuário ou se é um admin
      if (bet.user._id.toString() !== userId && !req.user.isAdmin) {
        throw new ApiError(403, 'Você não tem permissão para ver esta aposta');
      }
      
      // Criar resposta detalhada
      const betDetails = {
        id: bet._id,
        bet_slip_id: bet.bet_slip_id,
        user: {
          id: bet.user._id,
          username: bet.user.username,
          name: bet.user.name
        },
        match: {
          id: bet.match._id,
          title: bet.match.title,
          tournament: bet.match.tournament_name,
          start_time: bet.match.start_time,
          status: bet.match.status,
          teams: bet.match.teams
        },
        amount: bet.amount,
        odds: bet.odds,
        potential_return: bet.potential_return,
        type: bet.type,
        selection: bet.selection,
        status: bet.status,
        created_at: bet.createdAt,
        result: bet.settlement_data ? {
          settled_at: bet.settlement_data.timestamp,
          payout_amount: bet.settlement_data.payout_amount,
          payout_status: bet.settlement_data.payout_status
        } : null,
        is_live_bet: bet.is_live_bet,
        source: bet.source
      };
      
      res.status(200).json({
        success: true,
        data: betDetails
      });
    } catch (error) {
      logger.error(`Erro ao obter detalhes da aposta: ${error.message}`, { betId: req.params.id, error });
      next(error);
    }
  }
  
  /**
   * Cancelar uma aposta pendente
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async cancelBet(req, res, next) {
    // Iniciar sessão MongoDB para transação
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const userId = req.user.id;
      const betId = req.params.id;
      
      // Buscar aposta
      const bet = await Bet.findById(betId).session(session);
      
      if (!bet) {
        throw new ApiError(404, 'Aposta não encontrada');
      }
      
      // Verificar se a aposta pertence ao usuário
      if (bet.user.toString() !== userId) {
        throw new ApiError(403, 'Você não tem permissão para cancelar esta aposta');
      }
      
      // Verificar se a aposta pode ser cancelada
      if (bet.status !== 'pending') {
        throw new ApiError(400, 'Somente apostas pendentes podem ser canceladas');
      }
      
      // Verificar se está dentro do período permitido para cancelamento
      const match = await Match.findById(bet.match).session(session);
      if (!match) {
        throw new ApiError(404, 'Partida não encontrada');
      }
      
      const isEditable = await bet.isEditableTimeframe(match);
      if (!isEditable) {
        throw new ApiError(400, 'O período para cancelamento desta aposta já expirou');
      }
      
      // Obter carteira do usuário
      const wallet = await Wallet.findByUser(userId).session(session);
      if (!wallet) {
        throw new ApiError(404, 'Carteira não encontrada');
      }
      
      // Cancelar aposta
      await bet.cancel('Cancelada pelo usuário');
      
      // Criar transação de reembolso na carteira
      await wallet.createTransaction({
        amount: bet.amount,
        type: 'bet_refund',
        status: 'completed',
        description: `Reembolso: Aposta cancelada em ${match.title}`,
        reference: `REFUND-${bet.bet_slip_id}`,
        metadata: {
          bet_id: bet._id,
          match_id: match._id
        }
      });
      
      // Atualizar estatísticas da partida
      match.total_bets -= 1;
      match.total_bet_amount -= bet.amount;
      await match.save({ session });
      
      // Confirmar transação
      await session.commitTransaction();
      
      // Log do cancelamento
      logger.info(`Aposta cancelada pelo usuário`, { 
        userId, 
        betId,
        amount: bet.amount
      });
      
      res.status(200).json({
        success: true,
        message: 'Aposta cancelada com sucesso',
        data: {
          id: bet._id,
          status: bet.status,
          refund_amount: bet.amount
        }
      });
    } catch (error) {
      // Abortar transação em caso de erro
      await session.abortTransaction();
      
      logger.error(`Erro ao cancelar aposta: ${error.message}`, { 
        userId: req.user?.id, 
        betId: req.params?.id,
        error
      });
      
      next(error);
    } finally {
      // Finalizar sessão
      session.endSession();
    }
  }
  
  /**
   * Obter estatísticas de apostas do usuário
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async getUserBetStats(req, res, next) {
    try {
      const userId = req.user.id;
      
      // Obter estatísticas
      const stats = await Bet.getUserStats(userId);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Erro ao obter estatísticas de apostas: ${error.message}`, { userId: req.user.id, error });
      next(error);
    }
  }
  
  /**
   * Liquidar apostas após resultado de partida
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {Function} next - Função next do Express
   */
  static async settleBets(req, res, next) {
    // Iniciar sessão MongoDB para transação
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Verificar permissões - apenas admin ou sistema
      if (!req.user.isAdmin && !req.isSystem) {
        throw new ApiError(403, 'Permissão negada');
      }
      
      const { match_id, result } = req.body;
      
      if (!match_id || !result) {
        throw new ApiError(400, 'Dados insuficientes para liquidar apostas');
      }
      
      // Buscar partida
      const match = await Match.findById(match_id).session(session);
      if (!match) {
        throw new ApiError(404, 'Partida não encontrada');
      }
      
      // Verificar se a partida está finalizada
      if (match.status !== 'completed') {
        throw new ApiError(400, 'Somente partidas finalizadas podem ter apostas liquidadas');
      }
      
      // Verificar se as apostas ainda não foram liquidadas
      if (match.betting_status === 'settled') {
        throw new ApiError(400, 'As apostas desta partida já foram liquidadas');
      }
      
      // Atualizar resultado da partida (se necessário)
      if (result.winner_team_id && !match.result.winner_team_id) {
        match.result.winner_team_id = result.winner_team_id;
      }
      
      if (result.scores && result.scores.length > 0) {
        match.result.scores = result.scores;
      }
      
      if (result.special_markets_results && result.special_markets_results.length > 0) {
        match.result.special_markets_results = result.special_markets_results;
      }
      
      match.betting_status = 'settled';
      await match.save({ session });
      
      // Buscar todas as apostas pendentes para esta partida
      const pendingBets = await Bet.findByMatch(match_id, 'pending');
      
      // Contadores para estatísticas
      let settledCount = 0;
      let winningBetsCount = 0;
      let totalPayouts = 0;
      
      // Arrays para notificações em lote
      const winningUserIds = [];
      const losingUserIds = [];
      
      // Processar cada aposta
      for (const bet of pendingBets) {
        // Liquidar a aposta com o resultado
        await bet.settle(match.result);
        settledCount++;
        
        // Se a aposta foi ganha, processar pagamento
        if (bet.status === 'won') {
          winningBetsCount++;
          totalPayouts += bet.potential_return;
          winningUserIds.push(bet.user.toString());
          
          // Encontrar carteira do usuário e adicionar pagamento
          const wallet = await Wallet.findByUser(bet.user).session(session);
          if (wallet) {
            await wallet.createTransaction({
              amount: bet.potential_return,
              type: 'bet_won',
              status: 'completed',
              description: `Ganhos: Aposta em ${match.title}`,
              reference: `WIN-${bet.bet_slip_id}`,
              metadata: {
                bet_id: bet._id,
                match_id: match._id
              }
            });
            
            // Enviar notificação individual para apostas ganhas
            try {
              await NotificationService.sendToUser({
                userId: bet.user,
                type: 'match_result',
                title: 'Aposta ganha! 🎉',
                message: `Parabéns! Sua aposta de R$ ${bet.amount.toFixed(2)} em "${match.title}" foi vencedora. Você ganhou R$ ${bet.potential_return.toFixed(2)}!`,
                priority: 'normal',
                action: {
                  type: 'navigate',
                  target: `/bets/${bet._id}`
                },
                references: {
                  match: match._id,
                  bet: bet._id
                }
              });
            } catch (notificationError) {
              logger.error(`Erro ao enviar notificação de aposta ganha: ${notificationError.message}`, {
                userId: bet.user,
                betId: bet._id
              });
            }
          }
        } else if (bet.status === 'lost') {
          // Adicionar usuário à lista de perdedores para notificação em lote
          losingUserIds.push(bet.user.toString());
        }
      }
      
      // Enviar notificações em lote para apostas perdidas
      if (losingUserIds.length > 0) {
        try {
          await NotificationService.sendToMany({
            userIds: [...new Set(losingUserIds)], // Remover duplicatas
            type: 'match_result',
            title: 'Resultado da aposta',
            message: `O resultado de "${match.title}" foi divulgado. Infelizmente sua aposta não foi vencedora. Continue participando!`,
            priority: 'low',
            action: {
              type: 'navigate',
              target: `/matches/${match._id}`
            },
            references: {
              match: match._id
            }
          });
        } catch (notificationError) {
          logger.error(`Erro ao enviar notificações em lote para apostas perdidas: ${notificationError.message}`);
        }
      }
      
      // Confirmar transação
      await session.commitTransaction();
      
      // Log da liquidação
      logger.info(`Apostas liquidadas para partida`, { 
        matchId: match_id, 
        settledCount,
        winningBetsCount,
        totalPayouts,
        adminId: req.user.isAdmin ? req.user.id : 'system'
      });
      
      res.status(200).json({
        success: true,
        message: 'Apostas liquidadas com sucesso',
        data: {
          match_id,
          settled_count: settledCount,
          winning_bets_count: winningBetsCount,
          total_payouts: totalPayouts
        }
      });
    } catch (error) {
      // Abortar transação em caso de erro
      await session.abortTransaction();
      
      logger.error(`Erro ao liquidar apostas: ${error.message}`, { 
        matchId: req.body?.match_id,
        error
      });
      
      next(error);
    } finally {
      // Finalizar sessão
      session.endSession();
    }
  }

  static async getUserBetHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 10, skip = 0 } = req.query;
      
      // Opções de filtro
      const options = {
        limit: parseInt(limit),
        skip: parseInt(skip),
        status: ['won', 'lost', 'cancelled', 'settled'],
      };
      
      // Buscar apostas do usuário
      const bets = await Bet.findByUser(userId, options);
      
      // Formatar apostas para a resposta
      const formattedBets = bets.map(bet => ({
        id: bet._id,
        bet_slip_id: bet.bet_slip_id,
        match: {
          id: bet.match._id,
          title: bet.match.title,
          start_time: bet.match.start_time,
          status: bet.match.status
        },
        amount: bet.amount,
        odds: bet.odds,
        potential_return: bet.potential_return,
        type: bet.type,
        selection: bet.selection,
        status: bet.status,
        placed_at: bet.createdAt,
        result: bet.settlement_data ? {
          settled_at: bet.settlement_data.timestamp,
          payout_amount: bet.settlement_data.payout_amount,
          payout_status: bet.settlement_data.payout_status
        } : null
      }));
      
      res.status(200).json({
        success: true,
        data: formattedBets
      });
    } catch (error) {
      logger.error(`Erro ao obter histórico de apostas do usuário: ${error.message}`, { userId: req.user.id, error });
      next(error);
    }
  }
  
  static async getUserActiveBets(req, res, next) {
    try {
      const userId = req.user.id;
      const { limit = 10, skip = 0 } = req.query;
      
      // Opções de filtro
      const options = {
        limit: parseInt(limit),
        skip: parseInt(skip),
        status: ['pending'],
      };
      
      // Buscar apostas ativas do usuário
      const bets = await Bet.findByUser(userId, options);
      
      // Formatar apostas para a resposta
      const formattedBets = bets.map(bet => ({
        id: bet._id,
        bet_slip_id: bet.bet_slip_id,
        match: {
          id: bet.match._id,
          title: bet.match.title,
          start_time: bet.match.start_time,
          status: bet.match.status
        },
        amount: bet.amount,
        odds: bet.odds,
        potential_return: bet.potential_return,
        type: bet.type,
        selection: bet.selection,
        status: bet.status,
        placed_at: bet.createdAt
      }));
      
      res.status(200).json({
        success: true,
        data: formattedBets
      });
    } catch (error) {
      logger.error(`Erro ao obter apostas ativas do usuário: ${error.message}`, { userId: req.user.id, error });
      next(error);
    }
  }
  
  static async getBetById(req, res, next) {
    try {
      const userId = req.user.id;
      const betId = req.params.id;
      
      // Buscar aposta específica
      const bet = await Bet.findById(betId)
        .populate('match', 'title start_time status teams odds result tournament_name')
        .populate('user', 'username name');
        
      if (!bet) {
        throw new ApiError(404, 'Aposta não encontrada');
      }
      
      // Verificar se a aposta pertence ao usuário ou se é um admin
      if (bet.user._id.toString() !== userId && !req.user.isAdmin) {
        throw new ApiError(403, 'Você não tem permissão para ver esta aposta');
      }
      
      // Criar resposta detalhada
      const betDetails = {
        id: bet._id,
        bet_slip_id: bet.bet_slip_id,
        user: {
          id: bet.user._id,
          username: bet.user.username,
          name: bet.user.name
        },
        match: {
          id: bet.match._id,
          title: bet.match.title,
          tournament: bet.match.tournament_name,
          start_time: bet.match.start_time,
          status: bet.match.status,
          teams: bet.match.teams
        },
        amount: bet.amount,
        odds: bet.odds,
        potential_return: bet.potential_return,
        type: bet.type,
        selection: bet.selection,
        status: bet.status,
        created_at: bet.createdAt,
        result: bet.settlement_data ? {
          settled_at: bet.settlement_data.timestamp,
          payout_amount: bet.settlement_data.payout_amount,
          payout_status: bet.settlement_data.payout_status
        } : null,
        is_live_bet: bet.is_live_bet,
        source: bet.source
      };
      
      res.status(200).json({
        success: true,
        data: betDetails
      });
    } catch (error) {
      logger.error(`Erro ao obter detalhes da aposta: ${error.message}`, { betId: req.params.id, error });
      next(error);
    }
  }
  
  static async getPendingBets(req, res, next) {
    try {
      const { limit = 20, skip = 0, matchId } = req.query;
      
      // Opções de filtro
      const options = {
        limit: parseInt(limit),
        skip: parseInt(skip),
        status: ['pending'],
        matchId
      };
      
      // Buscar apostas pendentes
      const bets = await Bet.findAll(options);
      
      // Formatar apostas para a resposta
      const formattedBets = bets.map(bet => ({
        id: bet._id,
        bet_slip_id: bet.bet_slip_id,
        user: {
          id: bet.user._id,
          username: bet.user.username
        },
        match: {
          id: bet.match._id,
          title: bet.match.title,
          start_time: bet.match.start_time
        },
        amount: bet.amount,
        odds: bet.odds,
        potential_return: bet.potential_return,
        type: bet.type,
        selection: bet.selection,
        status: bet.status,
        placed_at: bet.createdAt
      }));
      
      res.status(200).json({
        success: true,
        data: formattedBets
      });
    } catch (error) {
      logger.error(`Erro ao obter apostas pendentes: ${error.message}`, { error });
      next(error);
    }
  }
  
  static async settleBet(req, res, next) {
    // Iniciar sessão MongoDB para transação
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const betId = req.params.id;
      const { outcome, notes } = req.body;
      
      if (!outcome || !['won', 'lost', 'cancelled'].includes(outcome)) {
        throw new ApiError(400, 'Resultado inválido');
      }
      
      // Buscar aposta
      const bet = await Bet.findById(betId).session(session);
      if (!bet) {
        throw new ApiError(404, 'Aposta não encontrada');
      }
      
      // Verificar se a aposta ainda pode ser liquidada
      if (bet.status !== 'pending') {
        throw new ApiError(400, 'Esta aposta já foi liquidada');
      }
      
      // Atualizar status da aposta
      bet.status = outcome;
      bet.settlement_data = {
        timestamp: new Date(),
        admin_id: req.user.id,
        outcome,
        notes: notes || '',
        payout_amount: outcome === 'won' ? bet.potential_return : 0,
        payout_status: outcome === 'won' ? 'pending' : 'not_applicable'
      };
      
      await bet.save({ session });
      
      // Se a aposta foi ganha, processar pagamento
      if (outcome === 'won') {
        // Encontrar carteira do usuário e adicionar pagamento
        const wallet = await Wallet.findByUser(bet.user).session(session);
        if (!wallet) {
          throw new ApiError(404, 'Carteira do usuário não encontrada');
        }
        
        await wallet.createTransaction({
          amount: bet.potential_return,
          type: 'bet_won',
          status: 'completed',
          description: `Ganhos: Aposta ID ${bet.bet_slip_id}`,
          reference: `WIN-${bet.bet_slip_id}`,
          metadata: {
            bet_id: bet._id,
            settled_by: req.user.id
          }
        });
        
        bet.settlement_data.payout_status = 'completed';
        await bet.save({ session });
      }
      
      // Se foi cancelada, reembolsar
      if (outcome === 'cancelled') {
        const wallet = await Wallet.findByUser(bet.user).session(session);
        if (!wallet) {
          throw new ApiError(404, 'Carteira do usuário não encontrada');
        }
        
        await wallet.createTransaction({
          amount: bet.amount,
          type: 'bet_refund',
          status: 'completed',
          description: `Reembolso: Aposta ID ${bet.bet_slip_id}`,
          reference: `REFUND-${bet.bet_slip_id}`,
          metadata: {
            bet_id: bet._id,
            settled_by: req.user.id,
            reason: notes || 'Cancelada pelo administrador'
          }
        });
      }
      
      // Confirmar transação
      await session.commitTransaction();
      
      // Log da liquidação
      logger.info(`Aposta liquidada manualmente por admin`, { 
        betId,
        adminId: req.user.id,
        outcome
      });
      
      res.status(200).json({
        success: true,
        message: `Aposta ${outcome === 'won' ? 'ganha' : outcome === 'lost' ? 'perdida' : 'cancelada'} com sucesso`,
        data: {
          id: bet._id,
          status: bet.status,
          settlement_data: bet.settlement_data
        }
      });
    } catch (error) {
      // Abortar transação em caso de erro
      await session.abortTransaction();
      
      logger.error(`Erro ao liquidar aposta: ${error.message}`, { 
        betId: req.params.id,
        error
      });
      
      next(error);
    } finally {
      // Finalizar sessão
      session.endSession();
    }
  }

  static async settleMatchBets(req, res, next) {
    return BetController.settleBets(req, res, next);
  }

  static async getAdminBetStats(req, res, next) {
    try {
      // Obter estatísticas para admin
      const stats = await Bet.getAdminStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Erro ao obter estatísticas de apostas para admin: ${error.message}`, { error });
      next(error);
    }
  }
}

module.exports = BetController; 