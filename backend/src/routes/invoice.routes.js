const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Koruma middleware'i - tüm rotalara uygula
router.use(authMiddleware.protect);

// Fatura listeleme ve oluşturma
router.route('/')
  .get(invoiceController.getAllInvoices)
  .post(invoiceController.createInvoice);

// Fatura istatistikleri
router.get('/stats', invoiceController.getInvoiceStats);

// Fatura detay, güncelleme ve silme
router.route('/:id')
  .get(invoiceController.getInvoiceById)
  .put(invoiceController.updateInvoice)
  .delete(invoiceController.deleteInvoice);

// PDF oluşturma ve e-posta gönderme
router.get('/:id/generate-pdf', invoiceController.generateInvoicePDF);
router.post('/:id/send-email', invoiceController.sendInvoiceByEmail);

// Ödeme hatırlatıcı gönderme
router.post('/:id/send-reminder', invoiceController.sendPaymentReminder);

// Ödeme ekleme
router.post('/:id/payments', invoiceController.addPayment);

module.exports = router; 
