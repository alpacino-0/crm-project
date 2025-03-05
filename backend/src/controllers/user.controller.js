const User = require('../models/user.model');

// Profil güncelleme
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'email', 'phone', 'department', 'avatar'];
    const updates = Object.keys(req.body);
    
    // İzin verilmeyen güncelleme alanlarını kontrol et
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Geçersiz güncelleme alanları' });
    }
    
    // Kullanıcıyı bul ve güncelle
    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Profil güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// Şifre değiştirme
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Gerekli alanları kontrol et
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Lütfen mevcut ve yeni şifreyi girin' });
    }
    
    // Kullanıcıyı bul
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    // Mevcut şifreyi doğrula
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Mevcut şifre yanlış' });
    }
    
    // Yeni şifreyi kaydet
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Şifre değiştirilirken hata oluştu',
      error: error.message
    });
  }
};

// (Admin) Tüm kullanıcıları getir
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      message: 'Kullanıcılar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// (Admin) Kullanıcı rolünü güncelle
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ message: 'Lütfen bir rol belirtin' });
    }
    
    // Geçerli rol mü kontrol et
    if (!['admin', 'manager', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Geçersiz rol' });
    }
    
    // Kullanıcıyı bul ve rolünü güncelle
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Kullanıcı rolü güncellenirken hata oluştu',
      error: error.message
    });
  }
}; 
