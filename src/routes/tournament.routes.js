/**
 * Rotas para gerenciamento de torneios
 */

const express = require('express');
const router = express.Router();
const TournamentController = require('../controllers/tournament.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateTournament } = require('../middleware/validation');

/**
 * @route   GET /api/tournaments
 * @desc    Obter lista de torneios com filtros opcionais
 * @access  Public
 */
router.get('/', TournamentController.getTournaments);

/**
 * @route   GET /api/tournaments/active
 * @desc    Obter torneios ativos
 * @access  Public
 */
router.get('/active', TournamentController.getActiveTournaments);

/**
 * @route   GET /api/tournaments/:id
 * @desc    Obter detalhes de um torneio específico
 * @access  Public
 */
router.get('/:id', TournamentController.getTournamentById);

/**
 * @route   GET /api/tournaments/:id/matches
 * @desc    Obter partidas de um torneio
 * @access  Public
 */
router.get('/:id/matches', TournamentController.getTournamentMatches);

/**
 * @route   GET /api/tournaments/:id/teams
 * @desc    Obter equipes participantes de um torneio
 * @access  Public
 */
router.get('/:id/teams', TournamentController.getTournamentTeams);

/**
 * @route   GET /api/tournaments/:id/standings
 * @desc    Obter classificação atual do torneio
 * @access  Public
 */
router.get('/:id/standings', TournamentController.getTournamentStandings);

/**
 * @route   POST /api/tournaments
 * @desc    Criar um novo torneio
 * @access  Private (Admin)
 */
router.post('/', authenticate, authorize('admin'), validateTournament, TournamentController.createTournament);

/**
 * @route   PUT /api/tournaments/:id
 * @desc    Atualizar informações de um torneio
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, authorize('admin'), validateTournament, TournamentController.updateTournament);

/**
 * @route   PUT /api/tournaments/:id/status
 * @desc    Atualizar status de um torneio
 * @access  Private (Admin)
 */
router.put('/:id/status', authenticate, authorize('admin'), TournamentController.updateTournamentStatus);

/**
 * @route   POST /api/tournaments/:id/teams
 * @desc    Adicionar equipes a um torneio
 * @access  Private (Admin)
 */
router.post('/:id/teams', authenticate, authorize('admin'), TournamentController.addTeamsToTournament);

/**
 * @route   PUT /api/tournaments/:id/standings
 * @desc    Atualizar classificação do torneio
 * @access  Private (Admin)
 */
router.put('/:id/standings', authenticate, authorize('admin'), TournamentController.updateTournamentStandings);

/**
 * @route   DELETE /api/tournaments/:id
 * @desc    Remover um torneio
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize('admin'), TournamentController.deleteTournament);

module.exports = router; 