const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interaction.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Koruma middleware'i - tüm rotalara uygula
router.use(authMiddleware.protect);

// Etkileşim CRUD rotaları
router.route('/')
  .get(interactionController.getAllInteractions)
  .post(interactionController.createInteraction);

router.route('/follow-ups')
  .get(interactionController.getFollowUps);

router.route('/:id')
  .get(interactionController.getInteractionById)
  .put(interactionController.updateInteraction)
  .delete(interactionController.deleteInteraction);

// Bir müşterinin tüm etkileşimlerini getir
router.get('/customer/:customerId', interactionController.getCustomerInteractions);

module.exports = router; 
