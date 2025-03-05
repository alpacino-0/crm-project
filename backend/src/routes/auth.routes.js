const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Kimlik doğrulama rotaları
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password/:token', authController.resetPassword);
router.get('/me', authMiddleware.protect, authController.getMe);

// Google OAuth rotaları
router.get('/google-auth-url', authController.getGoogleAuthUrl);
router.post('/google-callback', authController.handleGoogleCallback);
router.delete('/google-disconnect', authMiddleware.protect, authController.disconnectGoogle);

module.exports = router; 
