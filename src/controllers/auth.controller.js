/**
 * Controlador de autenticação
 * Responsável por gerenciar o registro, login e funções relacionadas à autenticação de usuários
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { ApiError } = require('../middleware/errorHandler');
const { generateTokens, JWT_SECRET } = require('../middleware/auth');
const logger = require('../utils/logger');
const RefreshToken = require('../models/token.model');
const tokenManager = require('../utils/tokenManager');
const apiResponse = require('../utils/apiResponses');
const NotificationService = require('../utils/notificationService');

class AuthController {
  /**
   * Registrar um novo usuário
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async register(req, res, next) {
    try {
      const { username, email, password, name, birthdate, phone } = req.body;
      
      logger.info(`Tentativa de registro para o usuário: ${email}`);
      
      // Verificar se o email já existe
      const emailExists = await User.findOne({ 'contact.email': email });
      if (emailExists) {
        logger.warn(`Tentativa de registro com email já cadastrado: ${email}`);
        return next(ApiError.badRequest('Email já cadastrado'));
      }
      
      // Verificar se o username já existe
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        logger.warn(`Tentativa de registro com username já cadastrado: ${username}`);
        return next(ApiError.badRequest('Nome de usuário já cadastrado'));
      }
      
      // Criar novo usuário
      const newUser = new User({
        username,
        password,
        name,
        contact: {
          email,
          phone
        },
        birthdate,
        roles: ['user']
      });
      
      // Salvar usuário no banco de dados
      await newUser.save();
      logger.info(`Novo usuário registrado com sucesso: ${email}`);
      
      // Gerar tokens JWT (access e refresh)
      const { token, refreshToken } = generateTokens(newUser);
      
      // Armazenar refresh token no banco de dados
      await newUser.addRefreshToken(refreshToken);
      
      // Enviar notificação de boas-vindas
      try {
        await NotificationService.sendWelcomeNotification(newUser._id);
        logger.info(`Notificação de boas-vindas enviada para o usuário: ${email}`);
      } catch (notificationError) {
        // Apenas registramos o erro, mas continuamos o fluxo
        logger.error(`Erro ao enviar notificação de boas-vindas: ${notificationError.message}`);
      }
      
      // Preparar dados do usuário para retorno (excluindo senha)
      const userData = {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        name: newUser.name,
        balance: newUser.wallet.balance,
        roles: newUser.roles,
        createdAt: newUser.createdAt
      };
      
      // Enviar resposta
      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          user: userData,
          token,
          refreshToken
        }
      });
    } catch (error) {
      logger.error(`Erro ao registrar usuário: ${error.message}`);
      next(error);
    }
  }

  /**
   * Autenticar um usuário existente
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      logger.info(`Tentativa de login para o usuário: ${email}`);
      
      // Validação básica
      if (!email || !password) {
        return next(ApiError.badRequest('Email e senha são obrigatórios'));
      }
      
      // Buscar usuário pelo email (incluindo campo password)
      const user = await User.findOne({ 'contact.email': email }).select('+password');
      
      // Verificar se o usuário existe
      if (!user) {
        logger.warn(`Tentativa de login com email não cadastrado: ${email}`);
        return next(ApiError.unauthorized('Credenciais inválidas'));
      }
      
      // Verificar se a conta está ativa (com exceção para conta específica)
      if (email !== 'ygorxrpx@gmail.com' && email !== 'admin@rpxplatform.com' && (!user.isActive || !user.is_active)) {
        logger.warn(`Tentativa de login em conta desativada: ${email}`);
        return next(ApiError.unauthorized('Conta desativada. Entre em contato com o suporte.'));
      }
      
      // Verificar senha
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        logger.warn(`Tentativa de login com senha incorreta: ${email}`);
        return next(ApiError.unauthorized('Credenciais inválidas'));
      }
      
      // Gerar tokens JWT (access e refresh)
      const { token, refreshToken } = generateTokens(user);
      
      // Armazenar refresh token no banco de dados (com verificação de segurança)
      try {
        if (typeof user.addRefreshToken === 'function') {
          await user.addRefreshToken(refreshToken);
        } else {
          logger.warn(`Método addRefreshToken não encontrado para o usuário: ${email}`);
          // Se o método não existir, apenas continuamos sem salvar o refresh token
        }
      } catch (tokenError) {
        logger.error(`Erro ao adicionar refresh token: ${tokenError.message}`);
        // Continuamos mesmo com erro no token
      }
      
      // Atualizar último login diretamente no banco de dados sem acionar validação
      try {
        await User.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date() } },
          { validateBeforeSave: false }
        );
        logger.info(`Último login atualizado para: ${email}`);
      } catch (updateError) {
        logger.error(`Erro ao atualizar último login: ${updateError.message}`);
        // Continuamos mesmo com erro na atualização do último login
      }
      
      logger.info(`Login bem-sucedido para o usuário: ${email}`);
      
      // Preparar dados do usuário para retorno (excluindo senha)
      const userData = {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        balance: user.wallet?.balance || 0,
        roles: user.roles || [user.role || 'user'],
        role: user.role,
        lastLogin: new Date() // Usar a data atual já que atualizamos no banco
      };
      
      // Verificar explicitamente se as roles estão incluídas
      if (!userData.roles) {
        logger.warn(`Roles não encontradas para o usuário: ${email}. Definindo padrão.`);
        userData.roles = [userData.role || 'user'];
      }
      
      // Log para debug
      logger.info(`Dados do usuário preparados para resposta: ${JSON.stringify({
        id: userData.id,
        username: userData.username,
        roles: userData.roles
      })}`);
      
      // Enviar resposta
      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: userData,
          token,
          refreshToken
        }
      });
    } catch (error) {
      logger.error(`Erro ao autenticar usuário: ${error.message}`);
      next(error);
    }
  }

  /**
   * Obter dados do usuário atual
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user._id;
      logger.info(`Buscando perfil do usuário: ${userId}`);
      
      // Buscar usuário pelo ID
      const user = await User.findById(userId);
      
      if (!user) {
        return next(ApiError.notFound('Usuário não encontrado'));
      }
      
      // Preparar dados do usuário para retorno
      const userData = {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        birthdate: user.birthdate,
        balance: user.wallet.balance,
        roles: user.roles,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        preferences: user.preferences
      };
      
      // Enviar resposta
      res.status(200).json({
        success: true,
        data: {
          user: userData
        }
      });
    } catch (error) {
      logger.error(`Erro ao buscar perfil do usuário: ${error.message}`);
      next(error);
    }
  }

  /**
   * Atualizar dados do usuário
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user._id;
      logger.info(`Atualizando perfil do usuário: ${userId}`);
      
      const { name, phone, preferences } = req.body;
      
      // Buscar usuário pelo ID
      const user = await User.findById(userId);
      
      if (!user) {
        return next(ApiError.notFound('Usuário não encontrado'));
      }
      
      // Atualizar campos
      if (name) user.name = name;
      if (phone) user.phone = phone;
      
      // Atualizar preferências se fornecidas
      if (preferences) {
        if (preferences.notifications) {
          if (preferences.notifications.email) {
            if (preferences.notifications.email.marketing !== undefined) {
              user.preferences.notifications.email.marketing = preferences.notifications.email.marketing;
            }
            if (preferences.notifications.email.security !== undefined) {
              user.preferences.notifications.email.security = preferences.notifications.email.security;
            }
            if (preferences.notifications.email.transactions !== undefined) {
              user.preferences.notifications.email.transactions = preferences.notifications.email.transactions;
            }
          }
          
          if (preferences.notifications.push) {
            if (preferences.notifications.push.marketing !== undefined) {
              user.preferences.notifications.push.marketing = preferences.notifications.push.marketing;
            }
            if (preferences.notifications.push.security !== undefined) {
              user.preferences.notifications.push.security = preferences.notifications.push.security;
            }
            if (preferences.notifications.push.transactions !== undefined) {
              user.preferences.notifications.push.transactions = preferences.notifications.push.transactions;
            }
          }
        }
        
        if (preferences.theme) {
          user.preferences.theme = preferences.theme;
        }
      }
      
      // Salvar usuário
      await user.save();
      logger.info(`Perfil do usuário atualizado com sucesso: ${userId}`);
      
      // Preparar dados do usuário para retorno
      const userData = {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone,
        birthdate: user.birthdate,
        preferences: user.preferences
      };
      
      // Enviar resposta
      res.status(200).json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: {
          user: userData
        }
      });
    } catch (error) {
      logger.error(`Erro ao atualizar perfil do usuário: ${error.message}`);
      next(error);
    }
  }

  /**
   * Alterar senha do usuário
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user._id;
      logger.info(`Alterando senha do usuário: ${userId}`);
      
      const { currentPassword, newPassword } = req.body;
      
      // Validação básica
      if (!currentPassword || !newPassword) {
        return next(ApiError.badRequest('Senha atual e nova senha são obrigatórias'));
      }
      
      // Verificar tamanho mínimo da nova senha
      if (newPassword.length < 8) {
        return next(ApiError.badRequest('A nova senha deve ter pelo menos 8 caracteres'));
      }
      
      // Buscar usuário pelo ID (incluindo campo password)
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        return next(ApiError.notFound('Usuário não encontrado'));
      }
      
      // Verificar senha atual
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        logger.warn(`Tentativa de alteração de senha com senha atual incorreta: ${userId}`);
        return next(ApiError.unauthorized('Senha atual incorreta'));
      }
      
      // Atualizar senha
      user.password = newPassword;
      
      // Invalidar todos os refresh tokens
      await user.clearRefreshTokens();
      
      // Salvar usuário
      await user.save();
      logger.info(`Senha do usuário alterada com sucesso: ${userId}`);
      
      // Gerar novos tokens JWT
      const { token, refreshToken } = generateTokens(user);
      
      // Armazenar novo refresh token
      await user.addRefreshToken(refreshToken);
      
      // Enviar resposta
      res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso',
        data: {
          token,
          refreshToken
        }
      });
    } catch (error) {
      logger.error(`Erro ao alterar senha do usuário: ${error.message}`);
      next(error);
    }
  }

  /**
   * Solicitar redefinição de senha
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      
      logger.info(`Solicitação de redefinição de senha para: ${email}`);
      
      // Validação básica
      if (!email) {
        return next(ApiError.badRequest('Email é obrigatório'));
      }
      
      // Buscar usuário pelo email
      const user = await User.findOne({ email });
      
      if (!user) {
        // Por segurança, não informamos que o email não existe
        logger.warn(`Solicitação de redefinição de senha para email não cadastrado: ${email}`);
        return res.status(200).json({
          success: true,
          message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
        });
      }
      
      // Gerar token de redefinição de senha
      const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
      
      // Salvar token e data de expiração
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
      await user.save();
      
      // Em uma implementação real, enviaríamos um email com o link para redefinição
      logger.info(`Token de redefinição de senha gerado para: ${email}`);
      
      // Enviar resposta
      res.status(200).json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha',
        // Apenas para fins de desenvolvimento/teste:
        devInfo: {
          resetToken,
          resetUrl: `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`
        }
      });
    } catch (error) {
      logger.error(`Erro ao solicitar redefinição de senha: ${error.message}`);
      next(error);
    }
  }

  /**
   * Redefinir senha com token
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      
      logger.info('Tentativa de redefinição de senha com token');
      
      // Validação básica
      if (!token || !newPassword) {
        return next(ApiError.badRequest('Token e nova senha são obrigatórios'));
      }
      
      // Verificar tamanho mínimo da nova senha
      if (newPassword.length < 8) {
        return next(ApiError.badRequest('A nova senha deve ter pelo menos 8 caracteres'));
      }
      
      // Buscar usuário pelo token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        logger.warn('Tentativa de redefinição de senha com token inválido ou expirado');
        return next(ApiError.badRequest('Token inválido ou expirado'));
      }
      
      // Atualizar senha
      user.password = newPassword;
      
      // Limpar campos de redefinição de senha
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      
      // Invalidar todos os refresh tokens
      await user.clearRefreshTokens();
      
      // Salvar usuário
      await user.save();
      logger.info(`Senha redefinida com sucesso para o usuário: ${user.email}`);
      
      // Enviar resposta
      res.status(200).json({
        success: true,
        message: 'Senha redefinida com sucesso'
      });
    } catch (error) {
      logger.error(`Erro ao redefinir senha: ${error.message}`);
      next(error);
    }
  }

  /**
   * Logout (revogação de refresh token)
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      logger.info('Tentativa de logout');
      
      // Validação básica
      if (!refreshToken) {
        return next(ApiError.badRequest('Refresh token é obrigatório'));
      }
      
      try {
        // Verificar token JWT
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        
        // Buscar usuário pelo ID
        const user = await User.findById(decoded.id);
        
        if (user) {
          // Remover refresh token
          await user.removeRefreshToken(refreshToken);
          logger.info(`Logout bem-sucedido para o usuário: ${user._id}`);
        }
      } catch (error) {
        // Ignorar erros de token inválido
        logger.warn(`Erro ao verificar refresh token durante logout: ${error.message}`);
      }
      
      // Sempre retorna sucesso para não vazar informações
      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      logger.error(`Erro durante logout: ${error.message}`);
      next(error);
    }
  }

  /**
   * Logout em todos os dispositivos
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  async logoutAll(req, res, next) {
    try {
      const userId = req.user._id;
      logger.info(`Tentativa de logout em todos os dispositivos para o usuário: ${userId}`);
      
      // Buscar usuário pelo ID
      const user = await User.findById(userId);
      
      if (!user) {
        return next(ApiError.notFound('Usuário não encontrado'));
      }
      
      // Invalidar todos os refresh tokens
      await user.clearRefreshTokens();
      logger.info(`Logout em todos os dispositivos realizado com sucesso para o usuário: ${userId}`);
      
      // Enviar resposta
      res.status(200).json({
        success: true,
        message: 'Logout em todos os dispositivos realizado com sucesso'
      });
    } catch (error) {
      logger.error(`Erro durante logout em todos os dispositivos: ${error.message}`);
      next(error);
    }
  }

  /**
   * Atualiza o access token usando um refresh token válido
   */
  async refreshToken(req, res) {
    try {
      // Obter refresh token do cookie ou do corpo da requisição
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return apiResponse.unauthorized(res, 'Refresh token não fornecido');
      }
      
      // Verificar se o token existe no banco de dados
      const tokenDoc = await RefreshToken.findOne({ 
        token: refreshToken,
        isRevoked: false
      });
      
      if (!tokenDoc) {
        return apiResponse.unauthorized(res, 'Refresh token inválido ou revogado');
      }
      
      // Verificar se o token ainda é válido
      const newTokens = tokenManager.refreshTokens(refreshToken);
      
      if (!newTokens) {
        return apiResponse.unauthorized(res, 'Refresh token expirado ou inválido');
      }
      
      // Decodificar o novo refresh token para obter data de expiração
      const decodedRefresh = tokenManager.verifyRefreshToken(newTokens.refreshToken);
      
      // Atualizar o token existente no banco de dados
      tokenDoc.token = newTokens.refreshToken;
      tokenDoc.expiresAt = new Date(decodedRefresh.exp * 1000);
      await tokenDoc.save();
      
      // Configurar cookie HTTP-only para o novo refresh token
      res.cookie('refreshToken', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
      });
      
      // Retornar novo access token
      return apiResponse.success(res, {
        accessToken: newTokens.accessToken
      }, 'Token atualizado com sucesso');
      
    } catch (error) {
      return apiResponse.serverError(res, 'Erro ao atualizar token', error);
    }
  }

  /**
   * Obter todas as sessões ativas do usuário
   */
  async getSessions(req, res) {
    try {
      const userId = req.user.id;
      
      // Buscar todas as sessões ativas do usuário
      const sessions = await RefreshToken.find({
        userId,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      }).select('createdAt userAgent ip expiresAt');
      
      return apiResponse.success(res, 
        sessions.map(session => ({
          id: session._id,
          userAgent: session.userAgent,
          ip: session.ip,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt
        }))
      );
      
    } catch (error) {
      return apiResponse.serverError(res, 'Erro ao buscar sessões', error);
    }
  }

  /**
   * Revogar uma sessão específica
   */
  async revokeSession(req, res) {
    try {
      const sessionId = req.params.id;
      const userId = req.user.id;
      
      // Verificar se o ID é válido
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return apiResponse.validationError(res, { id: 'ID de sessão inválido' });
      }
      
      // Buscar e revogar a sessão
      const session = await RefreshToken.findOneAndUpdate(
        { _id: sessionId, userId },
        { isRevoked: true }
      );
      
      if (!session) {
        return apiResponse.notFound(res, 'Sessão não encontrada');
      }
      
      return apiResponse.success(res, null, 'Sessão revogada com sucesso');
      
    } catch (error) {
      return apiResponse.serverError(res, 'Erro ao revogar sessão', error);
    }
  }

  /**
   * Revogar todas as sessões exceto a atual
   */
  async revokeAllSessions(req, res) {
    try {
      const userId = req.user.id;
      const currentToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!currentToken) {
        return apiResponse.badRequest(res, 'Token atual não encontrado');
      }
      
      // Revogar todas as sessões exceto a atual
      await RefreshToken.updateMany(
        { 
          userId, 
          token: { $ne: currentToken },
          isRevoked: false
        },
        { isRevoked: true }
      );
      
      return apiResponse.success(res, null, 'Todas as outras sessões foram revogadas');
      
    } catch (error) {
      return apiResponse.serverError(res, 'Erro ao revogar sessões', error);
    }
  }
}

module.exports = new AuthController(); 