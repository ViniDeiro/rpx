const express = require('express');
const router = express.Router();
const storeController = require('../controllers/store.controller');
const { authenticate } = require('../middleware/auth');

// Rota de teste
router.get('/test', (req, res) => {
  res.json({ message: 'Rota da loja funcionando!' });
});

// Rotas públicas
router.get('/products', storeController.getAllProducts);
router.get('/products/:id', storeController.getProductById);
router.get('/categories', storeController.getCategories);

// Rotas autenticadas
router.post('/purchase', authenticate, storeController.purchaseProduct);
router.get('/purchase-history', authenticate, storeController.getPurchaseHistory);

module.exports = router; 