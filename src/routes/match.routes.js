/**
 * Rotas para gerenciamento de partidas (matches)
 */

const express = require('express');
const router = express.Router();
const MatchController = require('../controllers/match.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateMatch, validateMatchResult } = require('../middleware/validation');

/**
 * @route   GET /api/matches
 * @desc    Obter todas as partidas disponíveis
 * @access  Public
 */
router.get('/', MatchController.getAllMatches);

/**
 * @route   GET /api/matches/live
 * @desc    Obter todas as partidas ao vivo
 * @access  Public
 */
router.get('/live', MatchController.getLiveMatches);

/**
 * @route   GET /api/matches/upcoming
 * @desc    Obter partidas que acontecerão em breve
 * @access  Public
 */
router.get('/upcoming', MatchController.getUpcomingMatches);

/**
 * @route   GET /api/matches/results
 * @desc    Obter resultados de partidas finalizadas
 * @access  Public
 */
router.get('/results', MatchController.getMatchResults);

/**
 * @route   GET /api/matches/:id
 * @desc    Obter detalhes de uma partida específica
 * @access  Public
 */
router.get('/:id', MatchController.getMatchById);

/**
 * @route   GET /api/matches/:id/odds
 * @desc    Obter odds atualizadas para uma partida
 * @access  Public
 */
router.get('/:id/odds', MatchController.getMatchOdds);

/**
 * @route   GET /api/matches/:id/stats
 * @desc    Obter estatísticas ao vivo de uma partida
 * @access  Public
 */
router.get('/:id/stats', MatchController.getMatchStats);

/**
 * @route   GET /api/matches/:id/markets
 * @desc    Obter mercados de apostas para uma partida
 * @access  Public
 */
router.get('/:id/markets', MatchController.getMatchMarkets);

/**
 * @route   GET /api/matches/:id/live
 * @desc    Obter estatísticas ao vivo de uma partida
 * @access  Public
 */
router.get('/:id/live', MatchController.getLiveStats);

/**
 * @route   POST /api/matches
 * @desc    Criar uma nova partida
 * @access  Private (Admin)
 */
router.post('/', authenticate, authorize('admin'), validateMatch, MatchController.createMatch);

/**
 * @route   PUT /api/matches/:id
 * @desc    Atualizar informações de uma partida
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, authorize('admin'), validateMatch, MatchController.updateMatch);

/**
 * @route   PUT /api/matches/:id/status
 * @desc    Atualizar status de uma partida (não iniciada, ao vivo, encerrada)
 * @access  Private (Admin)
 */
router.put('/:id/status', authenticate, authorize('admin'), MatchController.updateMatchStatus);

/**
 * @route   PUT /api/matches/:id/result
 * @desc    Registrar resultado final de uma partida
 * @access  Private (Admin)
 */
router.put('/:id/result', authenticate, authorize('admin'), validateMatchResult, MatchController.updateMatchResult);

/**
 * @route   DELETE /api/matches/:id
 * @desc    Remover uma partida
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize('admin'), MatchController.deleteMatch);

/**
 * @route   POST /api/matches/:id/stats
 * @desc    Atualizar estatísticas ao vivo de uma partida
 * @access  Private (Admin)
 */
router.post('/:id/stats', authenticate, authorize('admin'), MatchController.updateLiveStats);

/**
 * @route   POST /api/matches/:id/invite
 * @desc    Enviar convites para participar de uma partida
 * @access  Private
 */
router.post('/:id/invite', authenticate, MatchController.sendMatchInvitation);

/**
 * @route   POST /api/matches/:matchId/notify-upcoming
 * @desc    Notificar usuários sobre partida prestes a começar
 * @access  Private (Admin/System)
 */
router.post(
  '/:matchId/notify-upcoming',
  authenticate,
  authorize(['admin', 'system']),
  MatchController.notifyUpcomingMatch
);

/**
 * @route   POST /api/matches/:matchId/notify-results
 * @desc    Notificar usuários sobre resultados de partida
 * @access  Private (Admin/System)
 */
router.post(
  '/:matchId/notify-results',
  authenticate,
  authorize(['admin', 'system']),
  MatchController.notifyMatchResults
);

module.exports = router; 