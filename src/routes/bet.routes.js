const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Rotas para gerenciamento de apostas
 * NOTA: Implementação temporária simplificada
 */

/**
 * @route   GET /api/bets
 * @desc    Obter apostas do usuário logado
 * @access  Private (User)
 */
router.get('/', authenticate, (req, res) => {
  res.json({ message: 'API de apostas funcionando', success: true });
});

/**
 * @route   POST /api/bets
 * @desc    Criar uma nova aposta (mock)
 * @access  Private (User)
 */
router.post('/', authenticate, (req, res) => {
  const { match_id, amount, type, selection } = req.body;
  
  // Simulação de processamento
  res.status(201).json({
    success: true,
    message: 'Aposta simulada com sucesso (modo de teste)',
    data: {
      id: 'mock-bet-id',
      bet_slip_id: 'BET' + Date.now(),
      match: {
        id: match_id || 'match-1',
        title: 'Partida Simulada'
      },
      amount: amount || 100,
      odds: 2.5,
      potential_return: (amount || 100) * 2.5,
      type: type || 'match_winner',
      selection: selection || { team_id: 'team-1' },
      status: 'pending',
      placed_at: new Date()
    }
  });
});

/**
 * @route   GET /api/bets/stats/user
 * @desc    Obter estatísticas de apostas do usuário
 * @access  Private (User)
 */
router.get('/stats/user', authenticate, (req, res) => {
  res.json({ 
    success: true,
    data: {
      apostas_totais: 5,
      apostas_ganhas: 2,
      apostas_perdidas: 1,
      apostas_pendentes: 2,
      valor_total_apostado: 500,
      valor_total_ganho: 750
    }
  });
});

module.exports = router; 