const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Etkileşim bir müşteriye ait olmalıdır']
    },
    type: {
      type: String,
      required: [true, 'Etkileşim türü gereklidir'],
      enum: ['Telefon', 'E-posta', 'Toplantı', 'Not', 'Diğer']
    },
    description: {
      type: String,
      required: [true, 'Etkileşim açıklaması gereklidir']
    },
    date: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Etkileşimi oluşturan kullanıcı gereklidir']
    },
    nextFollowUp: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Beklemede', 'Tamamlandı', 'İleri Tarihli'],
      default: 'Tamamlandı'
    },
    documents: [{
      name: String,
      path: String,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }]
  }, 
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Etkileşimin ne kadar süre önce gerçekleştiğini hesaplayan sanal alan
interactionSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} gün önce`;
  if (hours > 0) return `${hours} saat önce`;
  if (minutes > 0) return `${minutes} dakika önce`;
  return `${seconds} saniye önce`;
});

module.exports = mongoose.model('Interaction', interactionSchema); 
