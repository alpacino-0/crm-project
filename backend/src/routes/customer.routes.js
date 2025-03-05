const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Koruma middleware'i - tüm rotalara uygula
router.use(authMiddleware.protect);

// Müşteri CRUD rotaları
router.route('/')
  .get(customerController.getAllCustomers)
  .post(customerController.createCustomer);

router.route('/stats')
  .get(customerController.getCustomerStats);

router.route('/:id')
  .get(customerController.getCustomerById)
  .put(customerController.updateCustomer)
  .delete(customerController.deleteCustomer);

module.exports = router; 
 
// Müşteri rotaları tanımlanıyor 
