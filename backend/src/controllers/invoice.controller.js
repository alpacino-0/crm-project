const Invoice = require('../models/invoice.model');
const Customer = require('../models/customer.model');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');

/**
 * Tüm faturaları getir (filtreleme ve arama desteği ile)
 */
exports.getAllInvoices = async (req, res) => {
  try {
    const { 
      customer, 
      status, 
      startDate,
      endDate,
      search,
      minAmount,
      maxAmount,
      isPaid,
      isOverdue,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 10, 
      page = 1 
    } = req.query;
    
    // Temel filtreleme seçenekleri
    const filter = {};
    
    // Müşteri filtreleme
    if (customer) {
      filter.customer = customer;
    }
    
    // Durum filtreleme
    if (status) {
      filter.status = status;
    }
    
    // Tarih aralığı filtreleme
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) {
        filter.issueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.issueDate.$lte = new Date(endDate);
      }
    }
    
    // Özel filtreler için belgeleri getir
    if (minAmount || maxAmount || isPaid !== undefined || isOverdue !== undefined) {
      // Tüm faturaları getir
      const invoices = await Invoice.find(filter)
        .populate('customer', 'firstName lastName email company')
        .populate('createdBy', 'firstName lastName email');
      
      let filteredInvoices = [...invoices];
      
      // Tutar filtresi
      if (minAmount || maxAmount) {
        filteredInvoices = filteredInvoices.filter(invoice => {
          const grandTotal = invoice.grandTotal;
          if (minAmount && maxAmount) {
            return grandTotal >= parseFloat(minAmount) && grandTotal <= parseFloat(maxAmount);
          } else if (minAmount) {
            return grandTotal >= parseFloat(minAmount);
          } else if (maxAmount) {
            return grandTotal <= parseFloat(maxAmount);
          }
          return true;
        });
      }
      
      // Ödendi mi filtresi
      if (isPaid !== undefined) {
        const paidStatus = isPaid === 'true' || isPaid === true;
        filteredInvoices = filteredInvoices.filter(invoice => invoice.isPaid === paidStatus);
      }
      
      // Vadesi geçmiş mi filtresi
      if (isOverdue !== undefined) {
        const overdueStatus = isOverdue === 'true' || isOverdue === true;
        filteredInvoices = filteredInvoices.filter(invoice => invoice.isOverdue === overdueStatus);
      }
      
      // Sayfalama
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
      
      return res.status(200).json({
        success: true,
        count: filteredInvoices.length,
        total: invoices.length,
        data: paginatedInvoices
      });
    }
    
    // Metin arama
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sıralama seçenekleri
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Sayfalama
    const skip = (page - 1) * limit;
    
    // Toplam belge sayısını al
    const total = await Invoice.countDocuments(filter);
    
    // Belgeleri getir
    const invoices = await Invoice.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customer', 'firstName lastName email company')
      .populate('createdBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      message: 'Faturalar getirilirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * ID'ye göre fatura getir
 */
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer', 'firstName lastName email company phone address')
      .populate('createdBy', 'firstName lastName email')
      .populate('proposal', 'proposalNumber');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }
    
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      message: 'Fatura getirilirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni fatura oluştur
 */
exports.createInvoice = async (req, res) => {
  try {
    // Gelen verileri al
    const invoiceData = req.body;
    
    // Kullanıcı ID'sini ekle
    invoiceData.createdBy = req.user.id;
    
    // Müşteri kontrol et
    const customer = await Customer.findById(invoiceData.customer);
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    // Fatura oluştur
    const invoice = new Invoice(invoiceData);
    
    // Kaydedilen faturayı getir (populate ile)
    const savedInvoice = await invoice.save();
    
    const populatedInvoice = await Invoice.findById(savedInvoice._id)
      .populate('customer', 'firstName lastName email company')
      .populate('createdBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: populatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      message: 'Fatura oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Fatura güncelle
 */
exports.updateInvoice = async (req, res) => {
  try {
    // Güncellenecek faturayı kontrol et
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }
    
    // Tamamen ödenmiş faturalar için kısıtlamalar
    if (invoice.status === 'Ödendi' && req.body.status && req.body.status !== 'Ödendi' && req.body.status !== 'İptal Edildi') {
      return res.status(400).json({ 
        message: 'Ödenmiş faturanın durumu sadece İptal Edildi olarak değiştirilebilir' 
      });
    }
    
    // Güncellenen faturayı getir
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('customer', 'firstName lastName email company')
      .populate('createdBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    res.status(500).json({
      message: 'Fatura güncellenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Faturayı sil
 */
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }
    
    // Ödenmiş faturalar silinemez, sadece iptal edilebilir
    if (invoice.status === 'Ödendi') {
      return res.status(400).json({ 
        message: 'Ödenmiş faturalar silinemez, sadece iptal edilebilir'
      });
    }
    
    await Invoice.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Fatura başarıyla silindi',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      message: 'Fatura silinirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Faturayı PDF olarak oluştur
 */
exports.generateInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }
    
    const customer = await Customer.findById(invoice.customer);
    
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    // PDF dosyasını oluştur
    const pdfPath = await pdfService.generatePDF(invoice, 'invoice', customer);
    
    res.status(200).json({
      success: true,
      message: 'Fatura PDF dosyası oluşturuldu',
      pdfPath
    });
  } catch (error) {
    res.status(500).json({
      message: 'PDF oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Faturayı e-posta ile gönder
 */
exports.sendInvoiceByEmail = async (req, res) => {
  try {
    const { customMessage } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }
    
    const customer = await Customer.findById(invoice.customer);
    
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    // PDF dosyasını oluştur
    const pdfPath = await pdfService.generatePDF(invoice, 'invoice', customer);
    
    // E-posta gönder
    await emailService.sendInvoice({
      to: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      invoiceNumber: invoice.invoiceNumber,
      pdfPath,
      amount: invoice.grandTotal.toFixed(2),
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      customMessage
    });
    
    // Fatura durumunu "Gönderildi" olarak güncelle (eğer taslak ise)
    if (invoice.status === 'Taslak') {
      await Invoice.findByIdAndUpdate(req.params.id, { status: 'Gönderildi' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Fatura e-posta olarak gönderildi'
    });
  } catch (error) {
    res.status(500).json({
      message: 'E-posta gönderilirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Ödeme hatırlatıcı e-posta gönder
 */
exports.sendPaymentReminder = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }
    
    // Sadece ödenmemiş ve vadesi geçmiş faturalar için
    if (invoice.isPaid || !invoice.isOverdue) {
      return res.status(400).json({ 
        message: 'Sadece ödenmemiş ve vadesi geçmiş faturalar için hatırlatıcı gönderilebilir'
      });
    }
    
    const customer = await Customer.findById(invoice.customer);
    
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    // PDF dosyasını oluştur
    const pdfPath = await pdfService.generatePDF(invoice, 'invoice', customer);
    
    // Gecikme gün sayısını hesapla
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = Math.abs(today - dueDate);
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // E-posta gönder
    await emailService.sendPaymentReminder({
      to: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      invoiceNumber: invoice.invoiceNumber,
      pdfPath,
      amount: invoice.grandTotal.toFixed(2),
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      daysOverdue
    });
    
    // Hatırlatma kaydı ekle (opsiyonel)
    invoice.reminderSent = true;
    invoice.lastReminderDate = new Date();
    await invoice.save();
    
    res.status(200).json({
      success: true,
      message: 'Ödeme hatırlatıcı e-posta gönderildi'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ödeme hatırlatıcı gönderilirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni ödeme ekle
 */
exports.addPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Fatura bulunamadı' });
    }
    
    // Yeni ödeme verisi
    const payment = {
      date: req.body.date || new Date(),
      amount: req.body.amount,
      method: req.body.method,
      notes: req.body.notes,
      recordedBy: req.user.id
    };
    
    // Ödeme miktarı kontrolü
    if (payment.amount <= 0) {
      return res.status(400).json({ message: 'Ödeme miktarı 0\'dan büyük olmalıdır' });
    }
    
    // Tutardan fazla ödeme kontrolü
    const currentPaidAmount = invoice.paidTotal || 0;
    if (currentPaidAmount + payment.amount > invoice.grandTotal) {
      return res.status(400).json({ 
        message: 'Ödeme miktarı kalan tutardan fazla olamaz',
        dueAmount: invoice.dueAmount
      });
    }
    
    // Ödemeyi ekle
    invoice.payments.push(payment);
    
    // Ödeme eklendiğinde durum otomatik güncellenir (pre-save hook)
    await invoice.save();
    
    res.status(200).json({
      success: true,
      message: 'Ödeme başarıyla eklendi',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      message: 'Ödeme eklenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Fatura istatistiklerini getir
 */
exports.getInvoiceStats = async (req, res) => {
  try {
    // Durumlara göre fatura sayıları
    const statusStats = await Invoice.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Aylara göre fatura sayıları (son 6 ay)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyStats = await Invoice.aggregate([
      { 
        $match: { createdAt: { $gte: sixMonthsAgo } } 
      },
      {
        $group: {
          _id: { 
            year: { $year: '$createdAt' }, 
            month: { $month: '$createdAt' } 
          },
          count: { $sum: 1 },
          totalAmount: { $sum: { $size: '$items' } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Ödeme durumu istatistikleri
    const totalInvoices = await Invoice.countDocuments();
    const paidInvoices = await Invoice.countDocuments({ status: 'Ödendi' });
    const partialInvoices = await Invoice.countDocuments({ status: 'Kısmi Ödeme' });
    const overdueInvoices = await Invoice.countDocuments({ status: 'Gecikmiş' });
    
    // Toplam ve ortalama fatura tutarları (virtual field olduğu için manuel hesaplama)
    const invoices = await Invoice.find();
    
    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.grandTotal, 0);
    const averageAmount = invoices.length > 0 ? totalAmount / invoices.length : 0;
    
    // Toplam ve ortalama ödeme süresi
    const paidInvoicesList = invoices.filter(invoice => invoice.status === 'Ödendi' && invoice.payments.length > 0);
    let totalPaymentDays = 0;
    
    paidInvoicesList.forEach(invoice => {
      const issueDate = new Date(invoice.issueDate);
      const lastPaymentDate = new Date(invoice.payments[invoice.payments.length - 1].date);
      const diffTime = Math.abs(lastPaymentDate - issueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalPaymentDays += diffDays;
    });
    
    const averagePaymentDays = paidInvoicesList.length > 0 ? totalPaymentDays / paidInvoicesList.length : 0;
    
    res.status(200).json({
      success: true,
      data: {
        statusStats,
        monthlyStats,
        paidPercentage: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
        partialPercentage: totalInvoices > 0 ? (partialInvoices / totalInvoices) * 100 : 0,
        overduePercentage: totalInvoices > 0 ? (overdueInvoices / totalInvoices) * 100 : 0,
        totalAmount,
        averageAmount,
        averagePaymentDays: Math.round(averagePaymentDays)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Fatura istatistikleri alınırken hata oluştu',
      error: error.message
    });
  }
}; 
