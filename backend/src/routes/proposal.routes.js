const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposal.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Koruma middleware'i - tüm rotalara uygula
router.use(authMiddleware.protect);

// Teklif listeleme ve oluşturma
router.route('/')
  .get(proposalController.getAllProposals)
  .post(proposalController.createProposal);

// Teklif istatistikleri
router.get('/stats', proposalController.getProposalStats);

// Teklif detay, güncelleme ve silme
router.route('/:id')
  .get(proposalController.getProposalById)
  .put(proposalController.updateProposal)
  .delete(proposalController.deleteProposal);

// PDF oluşturma ve e-posta gönderme
router.get('/:id/generate-pdf', proposalController.generateProposalPDF);
router.post('/:id/send-email', proposalController.sendProposalByEmail);

// Teklifi faturaya dönüştürme
router.post('/:id/convert-to-invoice', proposalController.convertToInvoice);

module.exports = router; 
