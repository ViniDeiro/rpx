const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');
const { authenticate } = require('../middleware/auth');

// Rota de teste
router.get('/test', (req, res) => {
  res.json({ message: 'Rota de partidas funcionando!' });
});

// Rotas públicas
router.get('/', matchController.getAllMatches);
router.get('/:id', matchController.getMatchById);
router.get('/:id/markets', matchController.getMatchMarkets);

// Rotas autenticadas
router.get('/:id/live-stats', authenticate, matchController.getLiveStats);

module.exports = router; 