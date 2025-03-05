const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Etkinlik başlığı gereklidir'] 
  },
  description: { 
    type: String 
  },
  type: { 
    type: String, 
    enum: ['toplanti', 'gorusme', 'telefon', 'email', 'gorev', 'diger'],
    required: [true, 'Etkinlik türü gereklidir']
  },
  startDate: { 
    type: Date, 
    required: [true, 'Başlangıç tarihi gereklidir'] 
  },
  endDate: { 
    type: Date,
    required: [true, 'Bitiş tarihi gereklidir']
  },
  allDay: { 
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['planlanmis', 'tamamlandi', 'iptal_edildi', 'ertelendi'],
    default: 'planlanmis'
  },
  color: {
    type: String,
    default: '#3498db' // Varsayılan mavi renk
  },
  location: { 
    type: String 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Kullanıcı ID gereklidir'] 
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer'
    // İsteğe bağlı, tüm etkinlikler bir müşteri ile ilişkili olmayabilir
  },
  reminders: [{
    time: { type: Number }, // Etkinlikten kaç dakika önce
    type: { type: String, enum: ['email', 'push', 'in-app'], default: 'email' }
  }],
  googleCalendarId: { 
    type: String // Google Calendar entegrasyonu için gerekirse
  },
  attendees: [{
    name: { type: String },
    email: { type: String },
    status: { type: String, enum: ['davet_edildi', 'kabul_etti', 'reddetti', 'belirsiz'], default: 'davet_edildi' }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Etkinlik başlangıç ve bitiş tarihlerini doğrula
eventSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    const error = new Error('Bitiş tarihi başlangıç tarihinden önce olamaz');
    return next(error);
  }
  next();
});

// Güncelleme sırasında updatedAt tarihini güncelle
eventSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Etkinlik başlangıç ve bitiş tarihleri üzerinde indeks oluştur
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ user: 1 });
eventSchema.index({ customer: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ status: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 