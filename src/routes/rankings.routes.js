const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/ranking.controller');
const { authenticate } = require('../middleware/auth');

// Rota de teste
router.get('/test', (req, res) => {
  res.json({ message: 'Rota de rankings funcionando!' });
});

// Rotas públicas
router.get('/bettors', rankingController.getBettorRanking);
router.get('/teams', rankingController.getTeamRanking);
router.get('/players', rankingController.getPlayerRanking);
router.get('/global-stats', rankingController.getGlobalStats);

// Rotas autenticadas
router.get('/personal-stats', authenticate, rankingController.getPersonalStats);

module.exports = router; 