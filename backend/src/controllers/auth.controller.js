const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/email.util');
const bcrypt = require('bcryptjs');
const { google } = require('googleapis');

// JWT Token oluşturma
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Kullanıcı kaydı
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // E-posta adresinin kullanılıp kullanılmadığını kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }
    
    // Yeni kullanıcı oluştur
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || 'user'
    });
    
    // Şifreyi yanıtta gönderme
    user.password = undefined;
    
    // Token oluştur
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    res.status(400).json({ message: 'Kullanıcı kaydı sırasında hata oluştu', error: error.message });
  }
};

// Kullanıcı girişi
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // E-posta ve şifre kontrolü
    if (!email || !password) {
      return res.status(400).json({ message: 'Lütfen e-posta ve şifre girin' });
    }
    
    // Kullanıcıyı bul
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    }
    
    // Şifreyi doğrula
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Geçersiz kimlik bilgileri' });
    }
    
    // Son giriş tarihini güncelle
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    // Şifreyi yanıtta gönderme
    user.password = undefined;
    
    // Token oluştur
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    res.status(400).json({ message: 'Giriş sırasında hata oluştu', error: error.message });
  }
};

// Şifremi unuttum
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Lütfen e-posta adresinizi girin' });
    }
    
    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Bu e-posta adresine sahip kullanıcı bulunamadı' });
    }
    
    // Şifre sıfırlama tokeni oluştur
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    
    // Reset URL oluştur
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    // E-posta gönderme
    const message = `
      Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:
      ${resetURL}
      
      Bu bağlantı 30 dakika boyunca geçerlidir.
      Bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.
    `;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'CRM - Şifre Sıfırlama Talebi (30 dakika geçerli)',
        message
      });
      
      res.status(200).json({
        success: true,
        message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        message: 'E-posta gönderilirken hata oluştu',
        error: error.message
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Şifre sıfırlama sırasında hata oluştu',
      error: error.message
    });
  }
};

// Şifre sıfırlama
exports.resetPassword = async (req, res) => {
  try {
    // Token'ı hash'le
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
      
    // Tokena sahip ve süresi geçmemiş kullanıcıyı bul
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        message: 'Geçersiz veya süresi dolmuş token'
      });
    }
    
    // Yeni şifreyi ayarla
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    // Otomatik giriş için token oluştur
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla sıfırlandı',
      token
    });
  } catch (error) {
    res.status(500).json({
      message: 'Şifre sıfırlama sırasında hata oluştu',
      error: error.message
    });
  }
};

// Oturum doğrulama / kullanıcı bilgilerini getirme
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Kullanıcı bilgileri alınırken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Google Calendar OAuth URL oluştur
 */
exports.getGoogleAuthUrl = (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Her zaman refresh token al
    });

    res.status(200).json({
      success: true,
      url: authUrl
    });
  } catch (error) {
    res.status(500).json({
      message: 'Google auth URL oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Google OAuth callback'i işle
 */
exports.handleGoogleCallback = async (req, res) => {
  try {
    const { code, userId } = req.body;

    if (!code || !userId) {
      return res.status(400).json({
        message: 'Kod ve kullanıcı ID gereklidir'
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Token al
    const { tokens } = await oauth2Client.getToken(code);

    // Kullanıcıyı güncelle
    const user = await User.findByIdAndUpdate(
      userId,
      {
        googleCalendarToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        'calendarIntegrations.googleCalendar.enabled': true,
        'calendarIntegrations.googleCalendar.lastSyncedAt': new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Google Calendar başarıyla bağlandı'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Google OAuth işlemesi sırasında hata oluştu',
      error: error.message
    });
  }
};

/**
 * Google Calendar bağlantısını kes
 */
exports.disconnectGoogle = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.id,
      {
        $unset: {
          googleCalendarToken: 1,
          googleRefreshToken: 1
        },
        'calendarIntegrations.googleCalendar.enabled': false
      }
    );

    res.status(200).json({
      success: true,
      message: 'Google Calendar bağlantısı başarıyla kesildi'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Google bağlantısı kesilirken hata oluştu',
      error: error.message
    });
  }
}; 