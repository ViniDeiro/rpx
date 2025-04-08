const { body, validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');
const mongoose = require('mongoose');
const apiResponse = require('../utils/apiResponses');

/**
 * Middleware para validação de dados
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Função next do Express
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return apiResponse.validationError(res, errors.mapped());
  }
  next();
};

/**
 * Validação para registro de usuário
 */
const validateRegister = [
  body('username')
    .notEmpty().withMessage('Nome de usuário é obrigatório')
    .isLength({ min: 3, max: 20 }).withMessage('Nome de usuário deve ter entre 3 e 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Nome de usuário deve conter apenas letras, números e underscores'),
  
  body('email')
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 8 }).withMessage('Senha deve ter pelo menos 8 caracteres')
    .matches(/\d/).withMessage('Senha deve conter pelo menos um número')
    .matches(/[a-z]/).withMessage('Senha deve conter pelo menos uma letra minúscula')
    .matches(/[A-Z]/).withMessage('Senha deve conter pelo menos uma letra maiúscula'),
  
  body('name')
    .notEmpty().withMessage('Nome completo é obrigatório')
    .isLength({ min: 3, max: 100 }).withMessage('Nome completo deve ter entre 3 e 100 caracteres'),
  
  body('birthdate')
    .notEmpty().withMessage('Data de nascimento é obrigatória')
    .isISO8601().withMessage('Data de nascimento inválida')
    .custom(value => {
      const birthdate = new Date(value);
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      
      if (birthdate > eighteenYearsAgo) {
        throw new Error('Você deve ter pelo menos 18 anos para se registrar');
      }
      
      return true;
    }),
  
  body('phone')
    .optional()
    .custom(value => {
      // Se não houver valor, considerar válido (campo opcional)
      if (!value) return true;
      
      // Remover todos os caracteres não numéricos para contar dígitos
      const digits = value.replace(/\D/g, '');
      
      // Verificar se tem pelo menos 10 dígitos (DDD + número)
      if (digits.length < 10 || digits.length > 11) {
        throw new Error('Telefone deve ter entre 10 e 11 dígitos incluindo DDD');
      }
      
      return true;
    }),
  
  validateRequest
];

/**
 * Validação para login
 */
const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email é obrigatório')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Senha é obrigatória'),
  
  validateRequest
];

/**
 * Validação para alteração de senha
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty().withMessage('Senha atual é obrigatória'),
  
  body('newPassword')
    .notEmpty().withMessage('Nova senha é obrigatória')
    .isLength({ min: 8 }).withMessage('Nova senha deve ter pelo menos 8 caracteres')
    .matches(/\d/).withMessage('Nova senha deve conter pelo menos um número')
    .matches(/[a-z]/).withMessage('Nova senha deve conter pelo menos uma letra minúscula')
    .matches(/[A-Z]/).withMessage('Nova senha deve conter pelo menos uma letra maiúscula')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Nova senha deve ser diferente da senha atual');
      }
      return true;
    }),
  
  validateRequest
];

/**
 * Validação para redefinição de senha
 */
const validatePasswordReset = [
  body('token')
    .notEmpty().withMessage('Token é obrigatório'),
  
  body('newPassword')
    .notEmpty().withMessage('Nova senha é obrigatória')
    .isLength({ min: 8 }).withMessage('Nova senha deve ter pelo menos 8 caracteres')
    .matches(/\d/).withMessage('Nova senha deve conter pelo menos um número')
    .matches(/[a-z]/).withMessage('Nova senha deve conter pelo menos uma letra minúscula')
    .matches(/[A-Z]/).withMessage('Nova senha deve conter pelo menos uma letra maiúscula'),
  
  validateRequest
];

/**
 * Validação para atualização de perfil
 */
const validateProfileUpdate = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage('Nome completo deve ter entre 3 e 100 caracteres'),
  
  body('phone')
    .optional()
    .custom(value => {
      // Se não houver valor, considerar válido (campo opcional)
      if (!value) return true;
      
      // Remover todos os caracteres não numéricos para contar dígitos
      const digits = value.replace(/\D/g, '');
      
      // Verificar se tem pelo menos 10 dígitos (DDD + número)
      if (digits.length < 10 || digits.length > 11) {
        throw new Error('Telefone deve ter entre 10 e 11 dígitos incluindo DDD');
      }
      
      return true;
    }),
  
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark', 'system']).withMessage('Tema deve ser light, dark ou system'),
  
  validateRequest
];

/**
 * Validação para criação de apostas
 */
const validateBetCreate = [
  body('matchId')
    .notEmpty().withMessage('ID da partida é obrigatório'),
  
  body('amount')
    .notEmpty().withMessage('Valor da aposta é obrigatório')
    .isFloat({ min: 5 }).withMessage('Valor mínimo de aposta é R$ 5,00'),
  
  body('selection')
    .notEmpty().withMessage('Seleção é obrigatória'),
  
  validateRequest
];

/**
 * Validação para transações na carteira
 */
const validateWalletTransaction = [
  body('amount')
    .notEmpty().withMessage('Valor é obrigatório')
    .isFloat({ min: 10 }).withMessage('Valor mínimo é R$ 10,00'),
  
  body('paymentMethod')
    .notEmpty().withMessage('Método de pagamento é obrigatório')
    .isIn(['pix', 'credit_card', 'debit_card', 'bank_transfer']).withMessage('Método de pagamento inválido'),
  
  validateRequest
];

module.exports = {
  validateRequest,
  validateRegister,
  validateLogin,
  validatePasswordChange,
  validatePasswordReset,
  validateProfileUpdate,
  validateBetCreate,
  validateWalletTransaction
}; 