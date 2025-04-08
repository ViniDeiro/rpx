const express = require('express');
const router = express.Router();
const WalletController = require('../controllers/wallet.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateWalletTransaction } = require('../middleware/validation');

/**
 * Rotas para carteira e transações
 */

/**
 * @route GET /api/wallet/balance
 * @desc Obter saldo da carteira do usuário
 * @access Privado
 */
router.get('/balance', authenticate, WalletController.getWalletBalance);

/**
 * @route GET /api/wallet/transactions
 * @desc Obter histórico de transações do usuário
 * @access Privado
 */
router.get('/transactions', authenticate, WalletController.getTransactionHistory);

/**
 * @route POST /api/wallet/deposit
 * @desc Solicitar depósito
 * @access Privado
 */
router.post('/deposit', authenticate, validateWalletTransaction, WalletController.requestDeposit);

/**
 * @route POST /api/wallet/withdraw
 * @desc Solicitar saque
 * @access Privado
 */
router.post('/withdraw', authenticate, validateWalletTransaction, WalletController.requestWithdrawal);

/**
 * @route GET /api/wallet/payment-methods
 * @desc Obter métodos de pagamento disponíveis
 * @access Público
 */
router.get('/payment-methods', WalletController.getPaymentMethods);

/**
 * Rotas para Administração
 */

/**
 * @route POST /api/wallet/confirm-deposit
 * @desc Confirmar depósito (admin/webhook)
 * @access Admin
 */
router.post('/confirm-deposit', authenticate, authorize(['admin']), WalletController.confirmDeposit);

/**
 * @route POST /api/wallet/process-withdrawal
 * @desc Processar saque (admin)
 * @access Admin
 */
router.post('/process-withdrawal', authenticate, authorize(['admin']), WalletController.processWithdrawal);

/**
 * @route POST /api/wallet/adjustment
 * @desc Adicionar ajuste à carteira (admin)
 * @access Admin
 */
router.post('/adjustment', authenticate, authorize(['admin']), WalletController.addAdjustment);

/**
 * @route POST /api/wallet/toggle-lock
 * @desc Bloquear ou desbloquear carteira (admin)
 * @access Admin
 */
router.post('/toggle-lock', authenticate, authorize(['admin']), WalletController.toggleWalletLock);

module.exports = router; 