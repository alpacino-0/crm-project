const mongoose = require('mongoose');

const proposalItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün/hizmet adı gereklidir']
  },
  description: {
    type: String
  },
  quantity: {
    type: Number,
    required: [true, 'Miktar gereklidir'],
    min: [1, 'Miktar en az 1 olmalıdır']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Birim fiyat gereklidir'],
    min: [0, 'Birim fiyat 0 veya daha büyük olmalıdır']
  },
  taxRate: {
    type: Number,
    default: 18, // Varsayılan KDV oranı %18
    min: 0,
    max: 100
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
});

// Toplam hesaplama için sanal alan
proposalItemSchema.virtual('total').get(function() {
  const subtotal = this.quantity * this.unitPrice;
  const discountAmount = subtotal * (this.discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (this.taxRate / 100);
  return afterDiscount + taxAmount;
});

const proposalSchema = new mongoose.Schema(
  {
    proposalNumber: {
      type: String,
      required: [true, 'Teklif numarası gereklidir'],
      unique: true,
      trim: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Teklif bir müşteriye ait olmalıdır']
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      required: [true, 'Teklif geçerlilik süresi gereklidir']
    },
    status: {
      type: String,
      enum: ['Taslak', 'Gönderildi', 'Görüşülüyor', 'Kabul Edildi', 'Reddedildi', 'İptal Edildi'],
      default: 'Taslak'
    },
    items: [proposalItemSchema],
    notes: {
      type: String
    },
    terms: {
      type: String
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    currency: {
      type: String,
      enum: ['TRY', 'USD', 'EUR', 'GBP'],
      default: 'TRY'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teklifi oluşturan kullanıcı gereklidir']
    },
    convertedToInvoice: {
      type: Boolean,
      default: false
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Teklif toplamını hesaplayan sanal alan
proposalSchema.virtual('subtotal').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);
});

proposalSchema.virtual('taxTotal').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((sum, item) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    return sum + (afterDiscount * (item.taxRate / 100));
  }, 0);
});

proposalSchema.virtual('discountTotal').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  
  // Kalem bazında indirimler
  const itemDiscounts = this.items.reduce((sum, item) => {
    const subtotal = item.quantity * item.unitPrice;
    return sum + (subtotal * (item.discount / 100));
  }, 0);
  
  // Genel indirim
  const generalDiscount = (this.subtotal - itemDiscounts) * (this.discount / 100);
  
  return itemDiscounts + generalDiscount;
});

proposalSchema.virtual('grandTotal').get(function() {
  const afterItemDiscounts = this.subtotal - this.items.reduce((sum, item) => {
    const subtotal = item.quantity * item.unitPrice;
    return sum + (subtotal * (item.discount / 100));
  }, 0);
  
  const afterGeneralDiscount = afterItemDiscounts - (afterItemDiscounts * (this.discount / 100));
  
  return afterGeneralDiscount + this.taxTotal;
});

// Otomatik teklif numarası oluşturma
proposalSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Son eklenen teklifi bul
    const lastProposal = await this.constructor.findOne(
      {}, 
      {}, 
      { sort: { 'createdAt': -1 } }
    );
    
    let nextNumber = 1;
    
    if (lastProposal && lastProposal.proposalNumber) {
      const lastNumberPart = lastProposal.proposalNumber.split('-')[2];
      nextNumber = parseInt(lastNumberPart, 10) + 1;
    }
    
    // TEK-YIL-AY-NO formatında teklif numarası oluştur
    this.proposalNumber = `TEK-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Proposal', proposalSchema); 
