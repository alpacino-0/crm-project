const Proposal = require('../models/proposal.model');
const Customer = require('../models/customer.model');
const Invoice = require('../models/invoice.model');
const pdfService = require('../services/pdf.service');
const emailService = require('../services/email.service');

/**
 * Tüm teklifleri getir (filtreleme ve arama desteği ile)
 */
exports.getAllProposals = async (req, res) => {
  try {
    const { 
      customer, 
      status, 
      startDate,
      endDate,
      search,
      minAmount,
      maxAmount,
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
    
    // Tutar aralığı filtreleme (virtual field olduğu için aggregation gerekli)
    let aggregation = [];
    
    // Eğer fiyat filtresi varsa aggregation kullan
    if (minAmount || maxAmount) {
      // Önce belgeleri getir
      const proposals = await Proposal.find(filter)
        .populate('customer', 'firstName lastName email company')
        .populate('createdBy', 'firstName lastName email');
      
      // Grandtotal field'ına göre filtrele
      const filteredProposals = proposals.filter(proposal => {
        const grandTotal = proposal.grandTotal;
        if (minAmount && maxAmount) {
          return grandTotal >= parseFloat(minAmount) && grandTotal <= parseFloat(maxAmount);
        } else if (minAmount) {
          return grandTotal >= parseFloat(minAmount);
        } else if (maxAmount) {
          return grandTotal <= parseFloat(maxAmount);
        }
        return true;
      });
      
      // Sayfalama
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedProposals = filteredProposals.slice(startIndex, endIndex);
      
      return res.status(200).json({
        success: true,
        count: filteredProposals.length,
        total: proposals.length,
        data: paginatedProposals
      });
    }
    
    // Metin arama
    if (search) {
      filter.$or = [
        { proposalNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sıralama seçenekleri
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Sayfalama
    const skip = (page - 1) * limit;
    
    // Toplam belge sayısını al
    const total = await Proposal.countDocuments(filter);
    
    // Belgeleri getir
    const proposals = await Proposal.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customer', 'firstName lastName email company')
      .populate('createdBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: proposals.length,
      total,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({
      message: 'Teklifler getirilirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * ID'ye göre teklif getir
 */
exports.getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('customer', 'firstName lastName email company phone address')
      .populate('createdBy', 'firstName lastName email');
    
    if (!proposal) {
      return res.status(404).json({ message: 'Teklif bulunamadı' });
    }
    
    res.status(200).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({
      message: 'Teklif getirilirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni teklif oluştur
 */
exports.createProposal = async (req, res) => {
  try {
    // Gelen verileri al
    const proposalData = req.body;
    
    // Kullanıcı ID'sini ekle
    proposalData.createdBy = req.user.id;
    
    // Müşteri kontrol et
    const customer = await Customer.findById(proposalData.customer);
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    // Teklif oluştur
    const proposal = new Proposal(proposalData);
    
    // Kaydedilen teklifi getir (populate ile)
    const savedProposal = await proposal.save();
    
    const populatedProposal = await Proposal.findById(savedProposal._id)
      .populate('customer', 'firstName lastName email company')
      .populate('createdBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      data: populatedProposal
    });
  } catch (error) {
    console.error('Teklif oluşturma hatası:', error);
    res.status(500).json({
      message: 'Teklif oluşturulurken hata oluştu',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Teklif güncelle
 */
exports.updateProposal = async (req, res) => {
  try {
    // Güncellenecek teklifi kontrol et
    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Teklif bulunamadı' });
    }
    
    // Faturaya dönüştürülmüşse güncellemeye izin verme
    if (proposal.convertedToInvoice) {
      return res.status(400).json({ 
        message: 'Bu teklif faturaya dönüştürüldüğü için güncellenemez' 
      });
    }
    
    // Durumu "Kabul Edildi" olarak güncelleniyorsa kontrol yap
    if (req.body.status === 'Kabul Edildi' && proposal.status !== 'Kabul Edildi') {
      // Kabul edilen teklif için yeni işlemler yapılabilir
      // Örneğin: müşteri son etkileşim tarihini güncelle
      await Customer.findByIdAndUpdate(
        proposal.customer,
        { lastContact: new Date() }
      );
    }
    
    // Güncellenen teklifi getir
    const updatedProposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('customer', 'firstName lastName email company')
      .populate('createdBy', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      data: updatedProposal
    });
  } catch (error) {
    res.status(500).json({
      message: 'Teklif güncellenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Teklifi sil
 */
exports.deleteProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Teklif bulunamadı' });
    }
    
    // Faturaya dönüştürülmüşse silmeye izin verme
    if (proposal.convertedToInvoice) {
      return res.status(400).json({ 
        message: 'Bu teklif faturaya dönüştürüldüğü için silinemez' 
      });
    }
    
    await proposal.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Teklif başarıyla silindi'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Teklif silinirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Teklifi PDF olarak oluştur
 */
exports.generateProposalPDF = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Teklif bulunamadı' });
    }
    
    const customer = await Customer.findById(proposal.customer);
    
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    // PDF dosyasını oluştur
    const pdfPath = await pdfService.generatePDF(proposal, 'proposal', customer);
    
    res.status(200).json({
      success: true,
      message: 'PDF dosyası başarıyla oluşturuldu',
      pdfPath: pdfPath.replace(/\\/g, '/')
    });
  } catch (error) {
    res.status(500).json({
      message: 'PDF oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Teklifi e-posta ile gönder
 */
exports.sendProposalByEmail = async (req, res) => {
  try {
    const { customMessage } = req.body;
    
    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Teklif bulunamadı' });
    }
    
    const customer = await Customer.findById(proposal.customer);
    
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    // PDF dosyasını oluştur
    const pdfPath = await pdfService.generatePDF(proposal, 'proposal', customer);
    
    // E-posta gönder
    await emailService.sendProposal({
      to: customer.email,
      customerName: `${customer.firstName} ${customer.lastName}`,
      proposalNumber: proposal.proposalNumber,
      pdfPath,
      amount: proposal.grandTotal.toFixed(2),
      currency: proposal.currency,
      validUntil: proposal.validUntil,
      customMessage
    });
    
    // Teklif durumunu "Gönderildi" olarak güncelle
    if (proposal.status === 'Taslak') {
      await Proposal.findByIdAndUpdate(req.params.id, { status: 'Gönderildi' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Teklif e-posta olarak gönderildi'
    });
  } catch (error) {
    res.status(500).json({
      message: 'E-posta gönderilirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Teklifi faturaya dönüştür
 */
exports.convertToInvoice = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('customer');
    
    if (!proposal) {
      return res.status(404).json({ message: 'Teklif bulunamadı' });
    }
    
    if (proposal.convertedToInvoice) {
      return res.status(400).json({ 
        message: 'Bu teklif zaten faturaya dönüştürülmüş',
        invoiceId: proposal.invoiceId
      });
    }
    
    // Kabul edilmiş teklifler faturaya dönüştürülebilir
    if (proposal.status !== 'Kabul Edildi') {
      return res.status(400).json({ 
        message: 'Yalnızca kabul edilmiş teklifler faturaya dönüştürülebilir' 
      });
    }
    
    // Fatura verilerini hazırla
    const invoiceData = {
      customer: proposal.customer._id,
      items: proposal.items,
      notes: proposal.notes,
      terms: proposal.terms,
      discount: proposal.discount,
      currency: proposal.currency,
      createdBy: req.user.id,
      proposal: proposal._id,
      issueDate: new Date(),
      // Fatura son ödeme tarihi (varsayılan: 15 gün sonra)
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    };
    
    // Özel son ödeme tarihi varsa kullan
    if (req.body.dueDate) {
      invoiceData.dueDate = new Date(req.body.dueDate);
    }
    
    // Fatura oluştur
    const invoice = new Invoice(invoiceData);
    await invoice.save();
    
    // Teklifi güncelle
    proposal.convertedToInvoice = true;
    proposal.invoiceId = invoice._id;
    await proposal.save();
    
    res.status(201).json({
      success: true,
      message: 'Teklif başarıyla faturaya dönüştürüldü',
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      message: 'Faturaya dönüştürülürken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Teklif istatistiklerini getir
 */
exports.getProposalStats = async (req, res) => {
  try {
    // Durumlara göre teklif sayıları
    const statusStats = await Proposal.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Aylara göre teklif sayıları (son 6 ay)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyStats = await Proposal.aggregate([
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
    
    // Kabul oranı
    const totalProposals = await Proposal.countDocuments({
      status: { $in: ['Gönderildi', 'Görüşülüyor', 'Kabul Edildi', 'Reddedildi'] }
    });
    
    const acceptedProposals = await Proposal.countDocuments({ status: 'Kabul Edildi' });
    
    const acceptanceRate = totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0;
    
    // Toplam ve ortalama teklif tutarları (virtual field olduğu için manuel hesaplama)
    const proposals = await Proposal.find();
    
    const totalAmount = proposals.reduce((sum, proposal) => sum + proposal.grandTotal, 0);
    const averageAmount = proposals.length > 0 ? totalAmount / proposals.length : 0;
    
    res.status(200).json({
      success: true,
      data: {
        statusStats,
        monthlyStats,
        acceptanceRate,
        totalAmount,
        averageAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Teklif istatistikleri alınırken hata oluştu',
      error: error.message
    });
  }
}; 
