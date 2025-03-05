const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
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
invoiceItemSchema.virtual('total').get(function() {
  const subtotal = this.quantity * this.unitPrice;
  const discountAmount = subtotal * (this.discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (this.taxRate / 100);
  return afterDiscount + taxAmount;
});

const paymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Ödeme tarihi gereklidir'],
    default: Date.now
  },
  amount: {
    type: Number,
    required: [true, 'Ödeme tutarı gereklidir'],
    min: [0, 'Ödeme tutarı 0 veya daha büyük olmalıdır']
  },
  method: {
    type: String,
    enum: ['Nakit', 'Banka Transferi', 'Kredi Kartı', 'Çek', 'Diğer'],
    required: [true, 'Ödeme yöntemi gereklidir']
  },
  notes: {
    type: String
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Ödemeyi kaydeden kullanıcı gereklidir']
  }
}, {
  timestamps: true
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Fatura numarası gereklidir'],
      unique: true,
      trim: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Fatura bir müşteriye ait olmalıdır']
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: [true, 'Fatura son ödeme tarihi gereklidir']
    },
    status: {
      type: String,
      enum: ['Taslak', 'Gönderildi', 'Kısmi Ödeme', 'Ödendi', 'Gecikmiş', 'İptal Edildi'],
      default: 'Taslak'
    },
    items: [invoiceItemSchema],
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
      required: [true, 'Faturayı oluşturan kullanıcı gereklidir']
    },
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal'
    },
    payments: [paymentSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Fatura toplamını hesaplayan sanal alanlar
invoiceSchema.virtual('subtotal').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);
});

invoiceSchema.virtual('taxTotal').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  return this.items.reduce((sum, item) => {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    return sum + (afterDiscount * (item.taxRate / 100));
  }, 0);
});

invoiceSchema.virtual('discountTotal').get(function() {
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

invoiceSchema.virtual('grandTotal').get(function() {
  const afterItemDiscounts = this.subtotal - this.items.reduce((sum, item) => {
    const subtotal = item.quantity * item.unitPrice;
    return sum + (subtotal * (item.discount / 100));
  }, 0);
  
  const afterGeneralDiscount = afterItemDiscounts - (afterItemDiscounts * (this.discount / 100));
  
  return afterGeneralDiscount + this.taxTotal;
});

invoiceSchema.virtual('paidTotal').get(function() {
  if (!this.payments || this.payments.length === 0) return 0;
  return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
});

invoiceSchema.virtual('dueAmount').get(function() {
  return this.grandTotal - this.paidTotal;
});

invoiceSchema.virtual('isPaid').get(function() {
  return this.paidTotal >= this.grandTotal;
});

invoiceSchema.virtual('isOverdue').get(function() {
  return !this.isPaid && new Date() > this.dueDate;
});

// Otomatik fatura numarası oluşturma
invoiceSchema.pre('save', async function(next) {
  if (!this.isNew) {
    return next();
  }

  try {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    // Son eklenen faturayı bul
    const lastInvoice = await this.constructor.findOne(
      {}, 
      {}, 
      { sort: { 'createdAt': -1 } }
    );
    
    let nextNumber = 1;
    
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastNumberPart = lastInvoice.invoiceNumber.split('-')[2];
      nextNumber = parseInt(lastNumberPart, 10) + 1;
    }
    
    // FAT-YIL-AY-NO formatında fatura numarası oluştur
    this.invoiceNumber = `FAT-${year}${month}-${String(nextNumber).padStart(4, '0')}`;
    next();
  } catch (error) {
    next(error);
  }
});

// Fatura durumunu güncelleme (ödemelere göre)
invoiceSchema.pre('save', function(next) {
  if (this.isNew) {
    return next();
  }
  
  // Ödeme durumuna göre fatura durumunu güncelle
  if (this.paidTotal === 0) {
    if (this.status !== 'Taslak' && this.status !== 'İptal Edildi') {
      this.status = 'Gönderildi';
    }
  } else if (this.paidTotal < this.grandTotal) {
    this.status = 'Kısmi Ödeme';
  } else {
    this.status = 'Ödendi';
  }
  
  // Son ödeme tarihi geçmiş ve tamamen ödenmemiş faturalar
  if (this.status !== 'Ödendi' && this.status !== 'İptal Edildi' && new Date() > this.dueDate) {
    this.status = 'Gecikmiş';
  }
  
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema); 
