const mongoose = require('mongoose'); 
 
// Müşteri şeması oluşturuluyor 

const customerSchema = new mongoose.Schema({
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
    match: [/^\S+@\S+\.\S+$/, 'Lütfen geçerli bir e-posta adresi giriniz']
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  status: {
    type: String,
    enum: ['Aktif', 'Potansiyel', 'Pasif', 'Kaybedildi'],
    default: 'Potansiyel'
  },
  source: {
    type: String,
    enum: ['Web Sitesi', 'Referans', 'Sosyal Medya', 'Reklam', 'Diğer'],
    default: 'Diğer'
  },
  tags: [String],
  notes: String,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customerValue: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  lastContact: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// İsim ve soyisimi birleştiren sanal alan
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Müşterinin etkileşim geçmişini getiren sanal alan
customerSchema.virtual('interactions', {
  ref: 'Interaction',
  localField: '_id',
  foreignField: 'customer'
});

// Arama yapılabilir alanlar için indeksleme
customerSchema.index({ firstName: 'text', lastName: 'text', email: 'text', company: 'text', tags: 'text', notes: 'text' });

module.exports = mongoose.model('Customer', customerSchema); 
