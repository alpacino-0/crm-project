const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'İsim alanı zorunludur'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Soyisim alanı zorunludur'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'E-posta alanı zorunludur'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Lütfen geçerli bir e-posta girin']
    },
    password: {
      type: String,
      required: [true, 'Şifre alanı zorunludur'],
      minlength: [6, 'Şifre en az 6 karakter olmalıdır']
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'user'],
      default: 'user'
    },
    department: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    avatar: {
      type: String
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    googleCalendarToken: {
      type: String
    },
    googleRefreshToken: {
      type: String
    },
    calendarIntegrations: {
      googleCalendar: {
        enabled: { type: Boolean, default: false },
        lastSyncedAt: Date
      }
    }
  },
  {
    timestamps: true
  }
);

// Şifreyi kaydetmeden önce hashleme
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Şifre doğrulama metodu
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Şifre sıfırlama tokeni oluşturma
userSchema.methods.createPasswordResetToken = function () {
  // Rastgele token oluştur
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  // Tokeni hashle ve kaydet
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  // Token'ın 30 dakika geçerli olmasını sağla
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
  
  return resetToken;
};

module.exports = mongoose.model('User', userSchema); 
