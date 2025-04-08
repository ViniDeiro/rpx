const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate, refreshToken, authorize } = require('../middleware/auth');
const { validateRegister, validateLogin, validatePasswordChange, validatePasswordReset } = require('../middleware/validation');

// Rota de teste
router.get('/test', (req, res) => {
  res.json({ message: 'Rota de autenticação funcionando!' });
});

/**
 * Rotas de autenticação
 */

/**
 * @route   POST /api/auth/register
 * @desc    Registrar um novo usuário
 * @access  Public
 */
router.post('/register', validateRegister, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuário e gerar tokens
 * @access  Public
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Obter novo access token usando refresh token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   GET /api/auth/profile
 * @desc    Retornar dados do usuário autenticado
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Atualizar dados do usuário
 * @access  Private
 */
router.put('/profile', authenticate, authController.updateProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Alterar senha do usuário
 * @access  Private
 */
router.put('/change-password', authenticate, validatePasswordChange, authController.changePassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar redefinição de senha
 * @access  Public
 */
router.post('/forgot-password', authController.requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Redefinir senha com token
 * @access  Public
 */
router.post('/reset-password', validatePasswordReset, authController.resetPassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Deslogar usuário (revogar tokens)
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/sessions
 * @desc    Obter todas as sessões ativas do usuário
 * @access  Private
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * @route   DELETE /api/auth/sessions/:id
 * @desc    Revogar uma sessão específica
 * @access  Private
 */
router.delete('/sessions/:id', authenticate, authController.revokeSession);

/**
 * @route   DELETE /api/auth/sessions
 * @desc    Revogar todas as sessões exceto a atual
 * @access  Private
 */
router.delete('/sessions', authenticate, authController.revokeAllSessions);

/**
 * @route   GET /api/auth/admin
 * @desc    Rota de teste para admin
 * @access  Private (Admin only)
 */
router.get('/admin', authenticate, authorize(['admin']), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acesso administrativo concedido',
    user: req.user
  });
});

module.exports = router; 