const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Korumalı rotalar - giriş gerektiren
router.use(authMiddleware.protect);

// Profil güncelleme rotaları
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// Admin rotaları
router.get(
  '/all',
  authMiddleware.authorize('admin'),
  userController.getAllUsers
);
router.put(
  '/:id/role',
  authMiddleware.authorize('admin'),
  userController.updateUserRole
);

module.exports = router; 
