const Interaction = require('../models/interaction.model');
const Customer = require('../models/customer.model');

// Tüm etkileşimleri getir (filtreleme ve arama desteği ile)
exports.getAllInteractions = async (req, res) => {
  try {
    const { 
      customer, 
      type, 
      status, 
      user,
      startDate,
      endDate,
      search,
      limit = 10, 
      page = 1 
    } = req.query;
    
    // Temel filtreleme seçenekleri
    const filter = {};
    
    // Müşteri filtreleme
    if (customer) {
      filter.customer = customer;
    }
    
    // Etkileşim türü filtreleme
    if (type) {
      filter.type = type;
    }
    
    // Durum filtreleme
    if (status) {
      filter.status = status;
    }
    
    // Kullanıcı filtreleme
    if (user) {
      filter.user = user;
    }
    
    // Tarih aralığı filtreleme
    if (startDate || endDate) {
      filter.date = {};
      
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }
    
    // Metin araması
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }
    
    // Sayfalama hesaplama
    const skip = (page - 1) * limit;
    
    // Veritabanı sorgusu
    const interactions = await Interaction.find(filter)
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip(skip)
      .populate('customer', 'firstName lastName email company')
      .populate('user', 'firstName lastName email');
    
    // Toplam etkileşim sayısını al
    const total = await Interaction.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      totalCount: total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: interactions
    });
  } catch (error) {
    res.status(500).json({
      message: 'Etkileşimler getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Bir müşterinin tüm etkileşimlerini getir
exports.getCustomerInteractions = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    
    // Müşterinin var olup olmadığını kontrol et
    const customerExists = await Customer.exists({ _id: customerId });
    
    if (!customerExists) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    // Etkileşimleri getir
    const interactions = await Interaction.find({ customer: customerId })
      .sort({ date: -1 })
      .populate('user', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: interactions.length,
      data: interactions
    });
  } catch (error) {
    res.status(500).json({
      message: 'Müşteri etkileşimleri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Tek bir etkileşimi ID'ye göre getir
exports.getInteractionById = async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.id)
      .populate('customer', 'firstName lastName email company')
      .populate('user', 'firstName lastName email');
    
    if (!interaction) {
      return res.status(404).json({ message: 'Etkileşim bulunamadı' });
    }
    
    res.status(200).json({
      success: true,
      data: interaction
    });
  } catch (error) {
    res.status(500).json({
      message: 'Etkileşim getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Yeni etkileşim oluştur
exports.createInteraction = async (req, res) => {
  try {
    // Müşterinin var olup olmadığını kontrol et
    const customerExists = await Customer.exists({ _id: req.body.customer });
    
    if (!customerExists) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    // İstek yapan kullanıcıyı etkileşime ekle
    req.body.user = req.user.id;
    
    // Etkileşimi oluştur
    const interaction = await Interaction.create(req.body);
    
    // Müşterinin son iletişim tarihini güncelle
    await Customer.findByIdAndUpdate(req.body.customer, {
      lastContact: new Date()
    });
    
    res.status(201).json({
      success: true,
      data: interaction
    });
  } catch (error) {
    res.status(400).json({
      message: 'Etkileşim oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// Etkileşimi güncelle
exports.updateInteraction = async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.id);
    
    if (!interaction) {
      return res.status(404).json({ message: 'Etkileşim bulunamadı' });
    }
    
    // Etkileşimi oluşturan kullanıcı veya admin değilse güncellemeye izin verme
    if (
      interaction.user.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ 
        message: 'Bu etkileşimi güncelleme yetkiniz yok' 
      });
    }
    
    // Etkileşimi güncelle
    const updatedInteraction = await Interaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedInteraction
    });
  } catch (error) {
    res.status(400).json({
      message: 'Etkileşim güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// Etkileşimi sil
exports.deleteInteraction = async (req, res) => {
  try {
    const interaction = await Interaction.findById(req.params.id);
    
    if (!interaction) {
      return res.status(404).json({ message: 'Etkileşim bulunamadı' });
    }
    
    // Etkileşimi oluşturan kullanıcı veya admin değilse silmeye izin verme
    if (
      interaction.user.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ 
        message: 'Bu etkileşimi silme yetkiniz yok' 
      });
    }
    
    await interaction.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Etkileşim başarıyla silindi'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Etkileşim silinirken hata oluştu',
      error: error.message
    });
  }
};

// Takip edilmesi gereken etkileşimleri getir
exports.getFollowUps = async (req, res) => {
  try {
    const now = new Date();
    
    // Bugün için takip edilecek etkileşimler
    const followUps = await Interaction.find({
      nextFollowUp: {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lte: new Date(now.setHours(23, 59, 59, 999))
      },
      status: { $ne: 'Tamamlandı' }
    })
      .sort({ nextFollowUp: 1 })
      .populate('customer', 'firstName lastName email company')
      .populate('user', 'firstName lastName email');
    
    res.status(200).json({
      success: true,
      count: followUps.length,
      data: followUps
    });
  } catch (error) {
    res.status(500).json({
      message: 'Takip edilecek etkileşimler getirilirken hata oluştu',
      error: error.message
    });
  }
}; 
