/**
 * Controlador para gerenciamento de equipes
 */

const Team = require('../models/team.model');
const Match = require('../models/match.model');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponses');
const mongoose = require('mongoose');

// Logger específico para o contexto de equipes
const teamLogger = logger.createContextLogger({ controller: 'team' });

/**
 * Obter lista de equipes com filtros opcionais
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.getTeams = async (req, res) => {
  try {
    const { 
      game, 
      name, 
      featured, 
      sort = 'name', 
      limit = 20, 
      page = 1 
    } = req.query;
    
    // Construir filtro
    const filter = {};
    
    if (game) filter.game = game;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (featured === 'true') filter.featured = true;
    
    // Paginação
    const skip = (page - 1) * limit;
    
    // Opções de ordenação
    const sortOptions = {};
    if (sort === 'name') sortOptions.name = 1;
    else if (sort === 'ranking') sortOptions.ranking = 1;
    else if (sort === '-ranking') sortOptions.ranking = -1;
    else if (sort === 'wins') sortOptions.wins = -1;
    else sortOptions.name = 1;
    
    // Buscar equipes com filtros aplicados
    const teams = await Team.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name logo description game ranking wins losses featured');
    
    // Contar total de equipes para paginação
    const total = await Team.countDocuments(filter);
    
    // Retornar resultado
    return apiResponse.success(res, {
      teams,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    teamLogger.error('Erro ao buscar equipes', { error: err.message });
    return apiResponse.serverError(res, 'Erro ao buscar equipes', err);
  }
};

/**
 * Obter equipes em destaque
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.getFeaturedTeams = async (req, res) => {
  try {
    const { game, limit = 10 } = req.query;
    
    // Construir filtro
    const filter = { featured: true };
    if (game) filter.game = game;
    
    // Buscar equipes em destaque
    const teams = await Team.find(filter)
      .sort({ ranking: 1 })
      .limit(parseInt(limit))
      .select('name logo description game ranking wins losses');
    
    // Retornar resultado
    return apiResponse.success(res, teams);
  } catch (err) {
    teamLogger.error('Erro ao buscar equipes em destaque', { error: err.message });
    return apiResponse.serverError(res, 'Erro ao buscar equipes em destaque', err);
  }
};

/**
 * Obter detalhes de uma equipe específica
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID da equipe
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.validationError(res, { id: 'ID da equipe inválido' });
    }
    
    // Buscar equipe por ID
    const team = await Team.findById(id)
      .populate('members.player', 'name nickname avatar social');
    
    // Verificar se a equipe existe
    if (!team) {
      return apiResponse.notFound(res, 'Equipe não encontrada');
    }
    
    // Retornar equipe
    return apiResponse.success(res, team);
  } catch (err) {
    teamLogger.error('Erro ao buscar equipe por ID', { error: err.message, id: req.params.id });
    return apiResponse.serverError(res, 'Erro ao buscar equipe', err);
  }
};

/**
 * Obter histórico de partidas de uma equipe
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.getTeamMatches = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, limit = 10, page = 1 } = req.query;
    
    // Validar ID da equipe
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.validationError(res, { id: 'ID da equipe inválido' });
    }
    
    // Verificar se a equipe existe
    const teamExists = await Team.exists({ _id: id });
    if (!teamExists) {
      return apiResponse.notFound(res, 'Equipe não encontrada');
    }
    
    // Construir filtro
    const filter = { teams: id };
    if (status) filter.status = status;
    
    // Paginação
    const skip = (page - 1) * limit;
    
    // Buscar partidas da equipe
    const matches = await Match.find(filter)
      .sort({ scheduledTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('teams', 'name logo')
      .populate('tournament', 'name')
      .populate('winner', 'name');
    
    // Contar total de partidas para paginação
    const total = await Match.countDocuments(filter);
    
    // Formatar resultados para destacar a equipe atual
    const formattedMatches = matches.map(match => {
      const matchData = match.toObject();
      
      // Destacar a equipe atual nos resultados
      if (matchData.score) {
        matchData.teamScore = matchData.score[id] || 0;
        
        // Determinar resultado para a equipe (vitória, derrota, empate)
        if (matchData.winner && matchData.winner._id.toString() === id) {
          matchData.result = 'win';
        } else if (matchData.winner) {
          matchData.result = 'loss';
        } else if (matchData.status === 'completed') {
          matchData.result = 'draw';
        }
      }
      
      return matchData;
    });
    
    // Retornar resultado
    return apiResponse.success(res, {
      matches: formattedMatches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    teamLogger.error('Erro ao buscar partidas da equipe', { error: err.message, id: req.params.id });
    return apiResponse.serverError(res, 'Erro ao buscar partidas da equipe', err);
  }
};

/**
 * Obter membros de uma equipe
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.getTeamMembers = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID da equipe
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.validationError(res, { id: 'ID da equipe inválido' });
    }
    
    // Buscar equipe por ID
    const team = await Team.findById(id)
      .populate('members.player', 'name nickname avatar social stats');
    
    // Verificar se a equipe existe
    if (!team) {
      return apiResponse.notFound(res, 'Equipe não encontrada');
    }
    
    // Retornar membros da equipe
    return apiResponse.success(res, team.members);
  } catch (err) {
    teamLogger.error('Erro ao buscar membros da equipe', { error: err.message, id: req.params.id });
    return apiResponse.serverError(res, 'Erro ao buscar membros da equipe', err);
  }
};

/**
 * Obter estatísticas de uma equipe
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.getTeamStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID da equipe
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.validationError(res, { id: 'ID da equipe inválido' });
    }
    
    // Buscar equipe por ID
    const team = await Team.findById(id);
    
    // Verificar se a equipe existe
    if (!team) {
      return apiResponse.notFound(res, 'Equipe não encontrada');
    }
    
    // Calcular estatísticas adicionais
    const totalMatches = team.wins + team.losses + team.draws;
    const winRate = totalMatches > 0 ? (team.wins / totalMatches) * 100 : 0;
    
    // Buscar últimas 5 partidas
    const recentMatches = await Match.find({ 
      teams: id,
      status: 'completed'
    })
    .sort({ endTime: -1 })
    .limit(5)
    .select('winner score teams')
    .populate('teams', 'name logo')
    .populate('winner', 'name');
    
    // Formatar resultados recentes
    const recentResults = recentMatches.map(match => {
      return {
        matchId: match._id,
        result: match.winner && match.winner._id.toString() === id ? 'win' : 
               (match.winner ? 'loss' : 'draw'),
        score: match.score || {}
      };
    });
    
    // Estruturar estatísticas
    const stats = {
      overview: {
        matches: totalMatches,
        wins: team.wins,
        losses: team.losses,
        draws: team.draws,
        winRate: winRate.toFixed(2),
        ranking: team.ranking,
        ratingChange: team.ratingChange || 0
      },
      performance: {
        totalScore: team.stats.totalScore || 0,
        avgScore: totalMatches > 0 ? (team.stats.totalScore / totalMatches).toFixed(2) : 0,
        totalKills: team.stats.totalKills || 0,
        avgKills: totalMatches > 0 ? (team.stats.totalKills / totalMatches).toFixed(2) : 0,
        highestKills: team.stats.highestKills || 0,
        tournaments: team.stats.tournaments || 0,
        tournamentWins: team.stats.tournamentWins || 0
      },
      recentForm: recentResults
    };
    
    // Retornar estatísticas
    return apiResponse.success(res, stats);
  } catch (err) {
    teamLogger.error('Erro ao buscar estatísticas da equipe', { error: err.message, id: req.params.id });
    return apiResponse.serverError(res, 'Erro ao buscar estatísticas da equipe', err);
  }
};

/**
 * Criar uma nova equipe
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.createTeam = async (req, res) => {
  try {
    const {
      name,
      tag,
      logo,
      banner,
      description,
      game,
      country,
      website,
      social,
      members,
      ranking,
      featured
    } = req.body;
    
    // Verificar se já existe uma equipe com o mesmo nome
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return apiResponse.validationError(res, { name: 'Já existe uma equipe com este nome' });
    }
    
    // Criar nova equipe
    const newTeam = new Team({
      name,
      tag,
      logo,
      banner,
      description,
      game,
      country,
      website,
      social,
      members: members || [],
      ranking,
      featured: featured || false,
      wins: 0,
      losses: 0,
      draws: 0,
      stats: {
        totalScore: 0,
        totalKills: 0,
        highestKills: 0,
        tournaments: 0,
        tournamentWins: 0
      },
      createdBy: req.user._id
    });
    
    // Salvar equipe
    await newTeam.save();
    
    // Log de sucesso
    teamLogger.info('Nova equipe criada', { teamId: newTeam._id, name: newTeam.name });
    
    // Retornar equipe criada
    return apiResponse.success(res, newTeam, 'Equipe criada com sucesso', 201);
  } catch (err) {
    teamLogger.error('Erro ao criar equipe', { error: err.message });
    return apiResponse.serverError(res, 'Erro ao criar equipe', err);
  }
};

/**
 * Atualizar informações de uma equipe
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      tag,
      logo,
      banner,
      description,
      game,
      country,
      website,
      social,
      ranking
    } = req.body;
    
    // Validar ID da equipe
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.validationError(res, { id: 'ID da equipe inválido' });
    }
    
    // Verificar se a equipe existe
    const team = await Team.findById(id);
    if (!team) {
      return apiResponse.notFound(res, 'Equipe não encontrada');
    }
    
    // Verificar se o novo nome já existe (se estiver sendo alterado)
    if (name && name !== team.name) {
      const existingTeam = await Team.findOne({ name, _id: { $ne: id } });
      if (existingTeam) {
        return apiResponse.validationError(res, { name: 'Já existe uma equipe com este nome' });
      }
    }
    
    // Atualizar informações da equipe
    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      {
        name: name || team.name,
        tag: tag || team.tag,
        logo: logo || team.logo,
        banner: banner || team.banner,
        description: description || team.description,
        game: game || team.game,
        country: country || team.country,
        website: website || team.website,
        social: social || team.social,
        ranking: ranking || team.ranking,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    // Log de sucesso
    teamLogger.info('Equipe atualizada', { teamId: id, updatedBy: req.user._id });
    
    // Retornar equipe atualizada
    return apiResponse.success(res, updatedTeam, 'Equipe atualizada com sucesso');
  } catch (err) {
    teamLogger.error('Erro ao atualizar equipe', { error: err.message, id: req.params.id });
    return apiResponse.serverError(res, 'Erro ao atualizar equipe', err);
  }
};

/**
 * Adicionar membro a uma equipe
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.addTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { player, role, joinDate, active, jersey } = req.body;
    
    // Validar ID da equipe
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.validationError(res, { id: 'ID da equipe inválido' });
    }
    
    // Verificar se a equipe existe
    const team = await Team.findById(id);
    if (!team) {
      return apiResponse.notFound(res, 'Equipe não encontrada');
    }
    
    // Verificar se o jogador já está na equipe
    const memberExists = team.members.some(member => 
      member.player.toString() === player
    );
    
    if (memberExists) {
      return apiResponse.validationError(res, { player: 'Este jogador já faz parte da equipe' });
    }
    
    // Adicionar novo membro
    const newMember = {
      player,
      role,
      joinDate: joinDate || new Date(),
      active: active !== undefined ? active : true,
      jersey: jersey || null
    };
    
    // Atualizar equipe com novo membro
    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      { 
        $push: { members: newMember },
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true }
    )
    .populate('members.player', 'name nickname avatar');
    
    // Log de sucesso
    teamLogger.info('Membro adicionado à equipe', { 
      teamId: id, 
      playerId: player, 
      updatedBy: req.user._id 
    });
    
    // Retornar equipe atualizada
    return apiResponse.success(res, updatedTeam, 'Membro adicionado à equipe com sucesso');
  } catch (err) {
    teamLogger.error('Erro ao adicionar membro à equipe', { error: err.message, id: req.params.id });
    return apiResponse.serverError(res, 'Erro ao adicionar membro à equipe', err);
  }
};

/**
 * Remover membro de uma equipe
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.removeTeamMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    
    // Validar IDs
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.validationError(res, { id: 'ID da equipe inválido' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return apiResponse.validationError(res, { memberId: 'ID do membro inválido' });
    }
    
    // Verificar se a equipe existe
    const team = await Team.findById(id);
    if (!team) {
      return apiResponse.notFound(res, 'Equipe não encontrada');
    }
    
    // Verificar se o membro existe na equipe
    const memberExists = team.members.some(member => 
      member.player.toString() === memberId
    );
    
    if (!memberExists) {
      return apiResponse.notFound(res, 'Membro não encontrado na equipe');
    }
    
    // Remover membro
    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      { 
        $pull: { members: { player: memberId } },
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true }
    )
    .populate('members.player', 'name nickname avatar');
    
    // Log de sucesso
    teamLogger.info('Membro removido da equipe', { 
      teamId: id, 
      playerId: memberId, 
      updatedBy: req.user._id 
    });
    
    // Retornar equipe atualizada
    return apiResponse.success(res, updatedTeam, 'Membro removido da equipe com sucesso');
  } catch (err) {
    teamLogger.error('Erro ao remover membro da equipe', { 
      error: err.message, 
      teamId: req.params.id, 
      memberId: req.params.memberId 
    });
    return apiResponse.serverError(res, 'Erro ao remover membro da equipe', err);
  }
};

/**
 * Marcar/desmarcar equipe como destaque
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.toggleFeaturedTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    // Validar ID da equipe
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.validationError(res, { id: 'ID da equipe inválido' });
    }
    
    // Verificar se a equipe existe
    const team = await Team.findById(id);
    if (!team) {
      return apiResponse.notFound(res, 'Equipe não encontrada');
    }
    
    // Atualizar status de destaque
    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      { 
        featured: featured !== undefined ? featured : !team.featured,
        updatedBy: req.user._id,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    // Log de sucesso
    teamLogger.info('Status de destaque da equipe atualizado', { 
      teamId: id, 
      featured: updatedTeam.featured, 
      updatedBy: req.user._id 
    });
    
    // Retornar equipe atualizada
    const message = updatedTeam.featured 
      ? 'Equipe marcada como destaque' 
      : 'Equipe removida dos destaques';
    
    return apiResponse.success(res, updatedTeam, message);
  } catch (err) {
    teamLogger.error('Erro ao atualizar status de destaque da equipe', { error: err.message, id: req.params.id });
    return apiResponse.serverError(res, 'Erro ao atualizar status de destaque da equipe', err);
  }
};

/**
 * Remover uma equipe
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 */
exports.deleteTeam = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    // Validar ID da equipe
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return apiResponse.validationError(res, { id: 'ID da equipe inválido' });
    }
    
    // Verificar se a equipe existe
    const team = await Team.findById(id);
    if (!team) {
      await session.abortTransaction();
      session.endSession();
      return apiResponse.notFound(res, 'Equipe não encontrada');
    }
    
    // Verificar se existem partidas associadas à equipe
    const matchesCount = await Match.countDocuments({ teams: id });
    if (matchesCount > 0) {
      await session.abortTransaction();
      session.endSession();
      return apiResponse.error(res, 'Não é possível excluir uma equipe com partidas associadas', 400);
    }
    
    // Remover equipe
    await Team.findByIdAndDelete(id, { session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Log de sucesso
    teamLogger.info('Equipe removida', { teamId: id, deletedBy: req.user._id });
    
    // Retornar sucesso
    return apiResponse.success(res, null, 'Equipe removida com sucesso');
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    
    teamLogger.error('Erro ao remover equipe', { error: err.message, id: req.params.id });
    return apiResponse.serverError(res, 'Erro ao remover equipe', err);
  }
}; 