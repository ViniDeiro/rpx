/**
 * Rotas de autenticação
 */

const express = require('express');
const router = express.Router();

// Rota para login
router.post('/login', (req, res) => {
  // Implementação temporária
  res.json({ message: 'Endpoint de login - implementação pendente' });
});

// Rota para registro
router.post('/register', (req, res) => {
  // Implementação temporária
  res.json({ message: 'Endpoint de registro - implementação pendente' });
});

// Rota para logout
router.post('/logout', (req, res) => {
  // Implementação temporária
  res.json({ message: 'Endpoint de logout - implementação pendente' });
});

// Rota para refresh token
router.post('/refresh-token', (req, res) => {
  // Implementação temporária
  res.json({ message: 'Endpoint de refresh token - implementação pendente' });
});

module.exports = router; 