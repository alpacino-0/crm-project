const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Koruma middleware'i - tüm rotalara uygula
router.use(authMiddleware.protect);

// Etkinlik listeleme ve oluşturma
router.route('/')
  .get(eventController.getAllEvents)
  .post(eventController.createEvent);

// Etkinlik istatistikleri
router.get('/stats', eventController.getEventStats);

// Google Calendar senkronizasyonu
router.post('/sync-google-calendar', eventController.syncWithGoogleCalendar);

// Etkinlik detay, güncelleme ve silme
router.route('/:id')
  .get(eventController.getEventById)
  .put(eventController.updateEvent)
  .delete(eventController.deleteEvent);

module.exports = router; 