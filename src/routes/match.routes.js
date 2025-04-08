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
 * @desc    Obter lista de partidas com filtros opcionais
 * @access  Public
 */
router.get('/', MatchController.getMatches);

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

module.exports = router; 