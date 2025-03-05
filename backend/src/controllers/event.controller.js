const Event = require('../models/event.model');
const Customer = require('../models/customer.model');
const User = require('../models/user.model');
const emailService = require('../services/email.service');
const googleCalendarService = require('../services/googleCalendar.service'); // Bu servisi daha sonra oluşturacağız
const mongoose = require('mongoose');

/**
 * Tüm etkinlikleri getir (filtreleme ve arama desteği ile)
 */
exports.getAllEvents = async (req, res) => {
  try {
    const { 
      type, 
      status, 
      startDate,
      endDate,
      search,
      customer,
      sortBy = 'startDate',
      sortDirection = 'asc',
      page = 1,
      limit = 10
    } = req.query;

    // Filtreleme için sorgu oluştur
    const query = { user: req.user.id };

    // Etkinlik türüne göre filtrele
    if (type) {
      query.type = type;
    }

    // Duruma göre filtrele
    if (status) {
      query.status = status;
    }

    // Müşteriye göre filtrele
    if (customer) {
      query.customer = customer;
    }

    // Tarih aralığına göre filtrele
    if (startDate) {
      query.startDate = { $gte: new Date(startDate) };
    }
    
    if (endDate) {
      query.endDate = { $lte: new Date(endDate) };
    }

    // Arama metnine göre filtrele
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Sayfalama
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sıralama
    const sort = {};
    sort[sortBy] = sortDirection === 'desc' ? -1 : 1;

    // Etkinlikleri getir
    const events = await Event.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customer', 'firstName lastName company email')
      .populate('user', 'firstName lastName email');

    // Toplam etkinlik sayısı
    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: events
    });
  } catch (error) {
    res.status(500).json({
      message: 'Etkinlikler alınırken hata oluştu',
      error: error.message
    });
  }
};

/**
 * ID'ye göre tekil etkinlik getir
 */
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('customer', 'firstName lastName company email phone')
      .populate('user', 'firstName lastName email');

    if (!event) {
      return res.status(404).json({
        message: 'Etkinlik bulunamadı'
      });
    }

    // Sadece kendi etkinliklerini görebilmeli (admin tüm etkinlikleri görebilir)
    if (event.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Bu etkinliğe erişim izniniz yok'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      message: 'Etkinlik alınırken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Yeni etkinlik oluştur
 */
exports.createEvent = async (req, res) => {
  try {
    // Gerekli kontroller (geçerli müşteri vs.)
    if (req.body.customer) {
      const customer = await Customer.findById(req.body.customer);
      if (!customer) {
        return res.status(404).json({
          message: 'Müşteri bulunamadı'
        });
      }
    }

    // Kullanıcı bilgisini ekle
    req.body.user = req.user.id;

    // Etkinliği oluştur
    const event = await Event.create(req.body);

    // Google Calendar'a ekle (entegrasyon varsa)
    if (req.body.syncWithGoogle && req.user.googleCalendarToken) {
      try {
        const googleEvent = await googleCalendarService.createEvent(event, req.user.googleCalendarToken);
        
        // Google Calendar ID'sini kaydet
        if (googleEvent && googleEvent.id) {
          await Event.findByIdAndUpdate(event._id, {
            googleCalendarId: googleEvent.id
          });
        }
      } catch (googleError) {
        console.error('Google Calendar senkronizasyon hatası:', googleError);
        // Hata olsa bile ana işleme devam et
      }
    }

    // Etkinliği katılımcılara e-posta ile bildir
    if (req.body.sendNotifications && event.attendees && event.attendees.length > 0) {
      try {
        await emailService.sendEventInvitation(event);
      } catch (emailError) {
        console.error('Etkinlik davetiye e-postası gönderme hatası:', emailError);
      }
    }

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(400).json({
      message: 'Etkinlik oluşturulurken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Etkinlik güncelle
 */
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Etkinlik bulunamadı'
      });
    }

    // Sadece kendi etkinliklerini güncelleyebilmeli (admin tüm etkinlikleri güncelleyebilir)
    if (event.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Bu etkinliği güncelleme izniniz yok'
      });
    }

    // Güncelleme tarihi ekle
    req.body.updatedAt = new Date();

    // Etkinliği güncelle
    event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Google Calendar'ı güncelle (entegrasyon varsa)
    if (event.googleCalendarId && req.user.googleCalendarToken) {
      try {
        await googleCalendarService.updateEvent(event, req.user.googleCalendarToken);
      } catch (googleError) {
        console.error('Google Calendar güncelleme hatası:', googleError);
      }
    }

    // Değişikliği katılımcılara bildir
    if (req.body.notifyChanges && event.attendees && event.attendees.length > 0) {
      try {
        await emailService.sendEventUpdate(event);
      } catch (emailError) {
        console.error('Etkinlik güncelleme bildirimi hatası:', emailError);
      }
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(400).json({
      message: 'Etkinlik güncellenirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Etkinlik sil
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: 'Etkinlik bulunamadı'
      });
    }

    // Sadece kendi etkinliklerini silebilmeli (admin tüm etkinlikleri silebilir)
    if (event.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Bu etkinliği silme izniniz yok'
      });
    }

    // Google Calendar'dan sil (entegrasyon varsa)
    if (event.googleCalendarId && req.user.googleCalendarToken) {
      try {
        await googleCalendarService.deleteEvent(event.googleCalendarId, req.user.googleCalendarToken);
      } catch (googleError) {
        console.error('Google Calendar silme hatası:', googleError);
      }
    }

    // İptal edildi diye katılımcılara bildir
    if (req.query.notifyCancellation && event.attendees && event.attendees.length > 0) {
      try {
        await emailService.sendEventCancellation(event);
      } catch (emailError) {
        console.error('Etkinlik iptal bildirimi hatası:', emailError);
      }
    }

    // Etkinliği sil
    await event.remove();

    res.status(200).json({
      success: true,
      message: 'Etkinlik başarıyla silindi'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Etkinlik silinirken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Etkinlik istatistiklerini getir
 */
exports.getEventStats = async (req, res) => {
  try {
    // Toplam etkinlik sayısı
    const totalEvents = await Event.countDocuments({ user: req.user.id });
    
    // Etkinlik türlerine göre dağılım
    const typeStats = await Event.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Etkinlik durumlarına göre dağılım
    const statusStats = await Event.aggregate([
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Tarih bazlı istatistikler (son 30 gün)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dateStats = await Event.aggregate([
      { 
        $match: { 
          user: mongoose.Types.ObjectId(req.user.id),
          startDate: { $gte: thirtyDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalEvents,
        typeStats,
        statusStats,
        dateStats
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Etkinlik istatistikleri alınırken hata oluştu',
      error: error.message
    });
  }
};

/**
 * Etkinlik hatırlatıcılarını gönder (cron job için)
 * Not: Bu metod API endpointi değil, bir scheduler tarafından çağrılmalı
 */
exports.sendEventReminders = async () => {
  try {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 saat sonra

    // Hatırlatılacak etkinlikleri bul
    const events = await Event.find({
      startDate: { $gt: now, $lt: oneDayFromNow },
      status: { $ne: 'iptal_edildi' }
    }).populate('user').populate('customer');

    for (const event of events) {
      // Reminders kontrol ediliyor
      if (event.reminders && event.reminders.length > 0) {
        for (const reminder of event.reminders) {
          const reminderTime = new Date(event.startDate.getTime() - reminder.time * 60 * 1000);
          
          // Şimdi hatırlatma zamanı geldiyse (5 dakika tolerans ile)
          if (Math.abs(reminderTime - now) < 5 * 60 * 1000) {
            try {
              if (reminder.type === 'email') {
                await emailService.sendEventReminder(event, event.user.email);
              }
              // Diğer bildirim türleri burada işlenebilir
            } catch (error) {
              console.error(`Etkinlik hatırlatıcı gönderme hatası (${event._id}):`, error);
            }
          }
        }
      }
    }

    return { success: true, count: events.length };
  } catch (error) {
    console.error('Etkinlik hatırlatıcıları gönderilirken hata oluştu:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Google Calendar ile senkronize et
 */
exports.syncWithGoogleCalendar = async (req, res) => {
  try {
    if (!req.user.googleCalendarToken) {
      return res.status(400).json({
        message: 'Google Calendar entegrasyonu yapılmamış'
      });
    }

    // Belirli bir süre (örn: 1 hafta) içindeki etkinlikleri al
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const events = await Event.find({
      user: req.user.id,
      startDate: { $gte: startDate, $lte: endDate }
    });

    // Her etkinliği Google Calendar'a senkronize et
    const syncResults = [];
    for (const event of events) {
      try {
        if (event.googleCalendarId) {
          // Güncelle
          await googleCalendarService.updateEvent(event, req.user.googleCalendarToken);
        } else {
          // Yeni oluştur
          const googleEvent = await googleCalendarService.createEvent(event, req.user.googleCalendarToken);
          
          // Google Calendar ID'sini kaydet
          if (googleEvent && googleEvent.id) {
            await Event.findByIdAndUpdate(event._id, {
              googleCalendarId: googleEvent.id
            });
          }
        }
        syncResults.push({ id: event._id, status: 'success' });
      } catch (error) {
        syncResults.push({ id: event._id, status: 'error', message: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `${events.length} etkinlik Google Calendar ile senkronize edildi`,
      data: syncResults
    });
  } catch (error) {
    res.status(500).json({
      message: 'Google Calendar senkronizasyon hatası',
      error: error.message
    });
  }
}; 