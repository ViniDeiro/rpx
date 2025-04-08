const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournament.controller');

// Rota de teste
router.get('/test', (req, res) => {
  res.json({ message: 'Rota de torneios funcionando!' });
});

// Rotas de torneios
router.get('/', tournamentController.getAllTournaments);
router.get('/:id', tournamentController.getTournamentById);
router.get('/:id/standings', tournamentController.getTournamentStandings);
router.get('/:id/matches', tournamentController.getTournamentMatches);

module.exports = router; 