/**
 * Middleware para versionamento da API
 */

const semver = require('semver');
const logger = require('../utils/logger');

/**
 * Versões suportadas da API
 * Manter ordenado da mais recente para a mais antiga
 */
const SUPPORTED_VERSIONS = ['1.1.0', '1.0.0'];
const DEFAULT_VERSION = SUPPORTED_VERSIONS[0];
const DEPRECATED_VERSIONS = ['1.0.0']; // Versões suportadas mas que serão removidas em versões futuras

/**
 * Middleware para verificar e determinar a versão da API
 */
const apiVersion = (req, res, next) => {
  // Obter versão da API dos headers ou da URL
  let requestedVersion = req.headers['api-version'] || req.query.version;
  
  // Se não fornecida, usar versão padrão
  if (!requestedVersion) {
    requestedVersion = DEFAULT_VERSION;
    req.apiVersion = DEFAULT_VERSION;
    return next();
  }
  
  // Checar se a versão é válida
  if (!semver.valid(requestedVersion)) {
    return res.status(400).json({
      success: false,
      message: 'Versão da API inválida',
      supportedVersions: SUPPORTED_VERSIONS
    });
  }
  
  // Verificar se a versão é suportada
  if (!SUPPORTED_VERSIONS.some(version => semver.satisfies(requestedVersion, version))) {
    return res.status(400).json({
      success: false,
      message: 'Versão da API não suportada',
      supportedVersions: SUPPORTED_VERSIONS
    });
  }
  
  // Verificar se a versão está depreciada
  if (DEPRECATED_VERSIONS.some(version => semver.satisfies(requestedVersion, version))) {
    res.set('X-API-Deprecated', 'true');
    res.set('X-API-Recommend-Version', DEFAULT_VERSION);
    
    logger.warn('Usando versão depreciada da API', {
      requestedVersion,
      recommendedVersion: DEFAULT_VERSION,
      path: req.path
    });
  }
  
  // Definir versão da API no objeto req para uso posterior
  req.apiVersion = requestedVersion;
  
  next();
};

/**
 * Middleware para versionar rota específica
 * @param {string} version - Versão mínima para acessar a rota (ex: '1.1.0')
 */
const requireVersion = (version) => {
  return (req, res, next) => {
    // Verificar se a versão solicitada é compatível com a versão necessária
    if (semver.gte(req.apiVersion, version)) {
      return next();
    }
    
    return res.status(404).json({
      success: false,
      message: `Endpoint disponível apenas na versão ${version} ou superior`,
      currentVersion: req.apiVersion,
      requiredVersion: version
    });
  };
};

module.exports = {
  apiVersion,
  requireVersion,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION
}; 