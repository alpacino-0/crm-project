// Müşteri veri modelini içe aktar
const Customer = require('../models/customer.model');
const Interaction = require('../models/interaction.model');

// Tüm müşterileri getir (filtreleme ve arama desteği ile)
exports.getAllCustomers = async (req, res) => {
  try {
    const { 
      status, 
      source, 
      tags, 
      assignedTo, 
      search,
      sortBy,
      customerValue,
      limit = 10, 
      page = 1 
    } = req.query;
    
    // Temel filtreleme seçenekleri
    const filter = {};
    
    // Status filtreleme
    if (status) {
      filter.status = status;
    }
    
    // Kaynak filtreleme
    if (source) {
      filter.source = source;
    }
    
    // Etiket filtreleme
    if (tags) {
      filter.tags = { $in: tags.split(',') };
    }
    
    // Atanmış kullanıcı filtreleme
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    
    // Müşteri değeri filtreleme
    if (customerValue) {
      filter.customerValue = customerValue;
    }
    
    // Metin araması
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sıralama seçenekleri
    const sort = {};
    if (sortBy) {
      const [field, order] = sortBy.split(':');
      sort[field] = order === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Varsayılan olarak en yeni müşteriler ilk sırada
    }
    
    // Sayfalama hesaplama
    const skip = (page - 1) * limit;
    
    // Veritabanı sorgusu
    const customers = await Customer.find(filter)
      .sort(sort)
      .limit(Number(limit))
      .skip(skip)
      .populate('assignedTo', 'firstName lastName email');
    
    // Toplam müşteri sayısını al
    const total = await Customer.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      totalCount: total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      message: 'Müşteriler getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Tek bir müşteriyi ID'ye göre getir (etkileşimlerle birlikte)
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate({
        path: 'interactions',
        options: { sort: { date: -1 } },
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      });
    
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      message: 'Müşteri getirilirken hata oluştu',
      error: error.message
    });
  }
};

// Yeni müşteri oluştur
exports.createCustomer = async (req, res) => {
  try {
    // Kullanıcı id'sini atanmış kişi olarak ekle (isteğe bağlı)
    if (!req.body.assignedTo) {
      req.body.assignedTo = req.user.id;
    }
    
    const customer = await Customer.create(req.body);
    
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      message: 'Müşteri oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

// Müşteriyi güncelle
exports.updateCustomer = async (req, res) => {
  try {
    // Güncellenen müşterinin son iletişim tarihini ayarla
    if (req.body.lastContact === undefined) {
      req.body.lastContact = new Date();
    }
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      message: 'Müşteri güncellenirken hata oluştu',
      error: error.message
    });
  }
};

// Müşteriyi sil
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı' });
    }
    
    // Müşteriye ait tüm etkileşimleri sil
    await Interaction.deleteMany({ customer: req.params.id });
    
    // Müşteriyi sil
    await customer.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Müşteri ve ilişkili tüm etkileşimler başarıyla silindi'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Müşteri silinirken hata oluştu',
      error: error.message
    });
  }
};

// Müşteri istatistiklerini getir
exports.getCustomerStats = async (req, res) => {
  try {
    // Durum bazında müşteri sayıları
    const statusStats = await Customer.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Kaynak bazında müşteri sayıları
    const sourceStats = await Customer.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    
    // Son hafta eklenen müşteriler
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const newCustomers = await Customer.countDocuments({
      createdAt: { $gte: lastWeek }
    });
    
    // Toplam müşteri sayısı
    const totalCustomers = await Customer.countDocuments();
    
    res.status(200).json({
      success: true,
      data: {
        total: totalCustomers,
        newThisWeek: newCustomers,
        byStatus: statusStats,
        bySource: sourceStats
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Müşteri istatistikleri alınırken hata oluştu',
      error: error.message
    });
  }
};
