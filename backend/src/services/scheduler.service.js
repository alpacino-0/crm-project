const cron = require('node-cron');
const eventController = require('../controllers/event.controller');
const logger = require('../utils/logger');

// Etkinlik hatırlatıcıları için her 5 dakikada bir çalışan görev
const scheduleEventReminders = () => {
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Etkinlik hatırlatıcıları kontrol ediliyor');
    try {
      const result = await eventController.sendEventReminders();
      if (result && result.count > 0) {
        logger.info(`${result.count} etkinlik için hatırlatıcı gönderildi`);
      }
    } catch (error) {
      logger.error('Etkinlik hatırlatıcı hatası:', error);
    }
  });
  logger.info('Etkinlik hatırlatıcı zamanlayıcısı başlatıldı');
};

module.exports = {
  scheduleEventReminders
}; 