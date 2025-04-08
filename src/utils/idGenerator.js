/**
 * Utilitário para gerar IDs únicos
 */

const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Gera um ID único para bilhete de aposta
 * @returns {string} ID único para aposta
 */
const generateBetSlipId = async () => {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  // Combinação de timestamp e bytes aleatórios
  const betSlipId = `BET-${timestamp.slice(-6)}-${randomBytes}`;
  
  try {
    // Verificar se já existe no banco
    const Bet = mongoose.model('Bet');
    const existingBet = await Bet.findOne({ bet_slip_id: betSlipId });
    
    // Se já existir, gerar outro ID
    if (existingBet) {
      return generateBetSlipId(); // Recursivo
    }
    
    return betSlipId;
  } catch (error) {
    // Se não conseguir verificar, gerar ID com mais entropia
    const highEntropyRandomBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
    return `BET-${timestamp.slice(-8)}-${highEntropyRandomBytes}`;
  }
};

/**
 * Gera um ID único para transação
 * @param {string} prefix - Prefixo para o ID (ex: TXN, DEP, WDR)
 * @returns {string} ID único para transação
 */
const generateTransactionId = (prefix = 'TXN') => {
  const timestamp = Date.now().toString();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  return `${prefix}-${timestamp.slice(-6)}-${randomBytes}`;
};

/**
 * Gera um ID único para torneio
 * @param {string} name - Nome do torneio
 * @returns {string} Slug para o torneio
 */
const generateTournamentSlug = (name) => {
  if (!name) return '';
  
  // Gerar slug a partir do nome
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiais
    .replace(/[\s_-]+/g, '-')  // Substituir espaços e underscores por hífens
    .replace(/^-+|-+$/g, '');  // Remover hífens do início e fim
  
  // Adicionar timestamp para garantir unicidade
  const timestamp = Date.now().toString().slice(-4);
  
  return `${slug}-${timestamp}`;
};

/**
 * Gera um código de convite aleatório
 * @param {number} length - Comprimento do código (padrão: 8)
 * @returns {string} Código de convite
 */
const generateInviteCode = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem caracteres ambíguos
  let code = '';
  
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % chars.length;
    code += chars.charAt(randomIndex);
  }
  
  return code;
};

module.exports = {
  generateBetSlipId,
  generateTransactionId,
  generateTournamentSlug,
  generateInviteCode
}; 