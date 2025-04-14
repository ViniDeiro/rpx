/**
 * Serviço para tarefas agendadas com cron
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const NotificationService = require('../utils/notificationService');

/**
 * Inicializar todas as tarefas agendadas
 */
const initCronJobs = () => {
  logger.info('Inicializando tarefas agendadas...');
  
  // Limpar notificações expiradas - Todos os dias às 04:00
  cron.schedule('0 4 * * *', cleanExpiredNotifications, {
    timezone: 'America/Sao_Paulo'
  });
  
  // Verificar partidas próximas - A cada 15 minutos
  cron.schedule('*/15 * * * *', checkUpcomingMatches, {
    timezone: 'America/Sao_Paulo'
  });
  
  // Outros jobs agendados podem ser adicionados aqui
  
  logger.info('Tarefas agendadas inicializadas com sucesso');
};

/**
 * Limpar notificações expiradas
 */
const cleanExpiredNotifications = async () => {
  logger.info('Executando limpeza de notificações expiradas...');
  
  try {
    const result = await NotificationService.cleanExpiredNotifications();
    logger.info(`Limpeza de notificações expiradas concluída: ${result.deletedCount} removidas`);
  } catch (error) {
    logger.error(`Erro ao limpar notificações expiradas: ${error.message}`);
  }
};

/**
 * Verificar partidas próximas e enviar notificações
 */
const checkUpcomingMatches = async () => {
  logger.info('Verificando partidas próximas...');
  
  try {
    // Esta implementação é um placeholder. Em uma implementação real, 
    // você buscaria partidas que estão próximas de começar (por exemplo, dentro de 30 minutos)
    // e enviaria notificações para os usuários interessados.
    
    // 1. Buscar partidas próximas
    // const upcomingMatches = await Match.find({
    //   startTime: { 
    //     $gt: new Date(), 
    //     $lt: new Date(Date.now() + 30 * 60 * 1000) // próximos 30 minutos
    //   },
    //   notificationSent: { $ne: true }
    // });
    
    // 2. Para cada partida, encontrar usuários interessados e enviar notificações
    // for (const match of upcomingMatches) {
    //   ...
    // }
    
    logger.info('Verificação de partidas próximas concluída');
  } catch (error) {
    logger.error(`Erro ao verificar partidas próximas: ${error.message}`);
  }
};

module.exports = {
  initCronJobs
}; 