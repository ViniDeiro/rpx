/**
 * Rotas para gerenciamento de equipes
 */

const express = require('express');
const router = express.Router();
const TeamController = require('../controllers/team.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateTeam, validateTeamMember } = require('../middleware/validation');

/**
 * @route   GET /api/teams
 * @desc    Obter lista de equipes com filtros opcionais
 * @access  Public
 */
router.get('/', TeamController.getTeams);

/**
 * @route   GET /api/teams/featured
 * @desc    Obter equipes em destaque
 * @access  Public
 */
router.get('/featured', TeamController.getFeaturedTeams);

/**
 * @route   GET /api/teams/:id
 * @desc    Obter detalhes de uma equipe específica
 * @access  Public
 */
router.get('/:id', TeamController.getTeamById);

/**
 * @route   GET /api/teams/:id/matches
 * @desc    Obter histórico de partidas de uma equipe
 * @access  Public
 */
router.get('/:id/matches', TeamController.getTeamMatches);

/**
 * @route   GET /api/teams/:id/members
 * @desc    Obter membros de uma equipe
 * @access  Public
 */
router.get('/:id/members', TeamController.getTeamMembers);

/**
 * @route   GET /api/teams/:id/stats
 * @desc    Obter estatísticas de uma equipe
 * @access  Public
 */
router.get('/:id/stats', TeamController.getTeamStats);

/**
 * @route   POST /api/teams
 * @desc    Criar uma nova equipe
 * @access  Private (Admin)
 */
router.post('/', authenticate, authorize('admin'), validateTeam, TeamController.createTeam);

/**
 * @route   PUT /api/teams/:id
 * @desc    Atualizar informações de uma equipe
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, authorize('admin'), validateTeam, TeamController.updateTeam);

/**
 * @route   POST /api/teams/:id/members
 * @desc    Adicionar membro a uma equipe
 * @access  Private (Admin)
 */
router.post('/:id/members', authenticate, authorize('admin'), validateTeamMember, TeamController.addTeamMember);

/**
 * @route   DELETE /api/teams/:id/members/:memberId
 * @desc    Remover membro de uma equipe
 * @access  Private (Admin)
 */
router.delete('/:id/members/:memberId', authenticate, authorize('admin'), TeamController.removeTeamMember);

/**
 * @route   PUT /api/teams/:id/featured
 * @desc    Marcar/desmarcar equipe como destaque
 * @access  Private (Admin)
 */
router.put('/:id/featured', authenticate, authorize('admin'), TeamController.toggleFeaturedTeam);

/**
 * @route   DELETE /api/teams/:id
 * @desc    Remover uma equipe
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize('admin'), TeamController.deleteTeam);

module.exports = router; 