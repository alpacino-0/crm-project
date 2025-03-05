const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// JWT ile kimlik doğrulama
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Token alınıyor
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Token yoksa hata döndür
    if (!token) {
      return res.status(401).json({ message: 'Bu kaynağa erişim için giriş yapmalısınız' });
    }
    
    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Kullanıcıyı bul
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: 'Bu token ile ilişkili kullanıcı artık mevcut değil' });
      }
      
      // Kullanıcı aktif değilse engelle
      if (!user.isActive) {
        return res.status(401).json({ message: 'Bu hesap devre dışı bırakılmış' });
      }
      
      // Kullanıcıyı isteğe ekle
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Geçersiz token, lütfen tekrar giriş yapın' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Kimlik doğrulama sırasında hata oluştu', error: error.message });
  }
};

// Rol tabanlı yetkilendirme
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `${req.user.role} rolünün bu işlemi gerçekleştirme yetkisi yok`
      });
    }
    next();
  };
}; 
