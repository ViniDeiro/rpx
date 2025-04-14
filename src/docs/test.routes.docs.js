/**
 * Documentação Swagger para as rotas de teste
 * Apenas disponível em ambiente de desenvolvimento
 */

/**
 * @swagger
 * tags:
 *   name: Teste
 *   description: Endpoints para teste - APENAS AMBIENTE DEV
 */

/**
 * @swagger
 * /api/test/notifications/single:
 *   post:
 *     summary: Gera uma notificação de teste para um usuário específico
 *     tags: [Teste]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário que receberá a notificação
 *               type:
 *                 type: string
 *                 description: Tipo da notificação
 *                 enum: [welcome, system_announcement, email_verified, match_invitation, match_accepted, match_rejected, match_canceled, match_reminder, match_result, match_dispute, transaction_completed, deposit_received, withdrawal_processed, refund_processed, bonus_received, friend_request, team_invitation, tournament_invitation]
 *                 default: system_announcement
 *               title:
 *                 type: string
 *                 description: Título da notificação
 *               message:
 *                 type: string
 *                 description: Mensagem da notificação
 *               priority:
 *                 type: string
 *                 description: Prioridade da notificação
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *     responses:
 *       201:
 *         description: Notificação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notificação de teste criada com sucesso
 *                 data:
 *                   type: object
 *       403:
 *         description: Acesso negado - apenas ambiente de desenvolvimento
 *       400:
 *         description: Dados inválidos fornecidos
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /api/test/notifications/system:
 *   post:
 *     summary: Gera uma notificação de sistema para todos os usuários
 *     tags: [Teste]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título da notificação
 *               message:
 *                 type: string
 *                 description: Mensagem da notificação
 *               priority:
 *                 type: string
 *                 description: Prioridade da notificação
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *     responses:
 *       201:
 *         description: Notificação de sistema enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notificação de sistema enviada com sucesso
 *                 data:
 *                   type: object
 *       403:
 *         description: Acesso negado - apenas ambiente de desenvolvimento
 *       400:
 *         description: Dados inválidos fornecidos
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /api/test/notifications/multiple:
 *   post:
 *     summary: Gera múltiplas notificações de teste para um usuário
 *     tags: [Teste]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID do usuário que receberá as notificações
 *               count:
 *                 type: integer
 *                 description: Número de notificações a serem geradas
 *                 default: 5
 *                 minimum: 1
 *                 maximum: 20
 *               types:
 *                 type: array
 *                 description: Lista de tipos de notificação a serem gerados
 *                 items:
 *                   type: string
 *                   enum: [welcome, system_announcement, email_verified, match_invitation, match_accepted, match_rejected, match_canceled, match_reminder, match_result, match_dispute, transaction_completed, deposit_received, withdrawal_processed, refund_processed, bonus_received, friend_request, team_invitation, tournament_invitation]
 *     responses:
 *       201:
 *         description: Notificações geradas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 5 notificações de teste geradas com sucesso
 *                 data:
 *                   type: object
 *       403:
 *         description: Acesso negado - apenas ambiente de desenvolvimento
 *       400:
 *         description: Dados inválidos fornecidos
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /api/test/notifications/user/{userId}:
 *   delete:
 *     summary: Limpa todas as notificações de um usuário específico
 *     tags: [Teste]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Notificações excluídas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notificações de teste excluídas com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 10
 *       403:
 *         description: Acesso negado - apenas ambiente de desenvolvimento
 *       400:
 *         description: ID de usuário inválido
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /api/test/notifications/all:
 *   delete:
 *     summary: Limpa todas as notificações do sistema
 *     tags: [Teste]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas as notificações excluídas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Todas as notificações excluídas com sucesso
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 100
 *       403:
 *         description: Acesso negado - apenas ambiente de desenvolvimento
 *       500:
 *         description: Erro interno do servidor
 */ 