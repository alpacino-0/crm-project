const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Event = require('../src/models/event.model');
const Customer = require('../src/models/customer.model');
const User = require('../src/models/user.model');

// Test öncesi ve sonrası işlemler
beforeAll(async () => {
  // Test veritabanına bağlan
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/crm-test');
  
  // Test veritabanını temizle
  await Event.deleteMany({});
  await Customer.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  // Bağlantıyı kapat
  await mongoose.connection.close();
});

describe('Etkinlik API Testleri', () => {
  // Test için kimlik bilgileri
  const testUser = {
    firstName: 'Test',
    lastName: 'Kullanıcı',
    email: 'test.event@example.com',
    password: 'Test123456',
    role: 'user'
  };
  
  const testCustomer = {
    firstName: 'Ahmet',
    lastName: 'Müşteri',
    email: 'ahmet.etkinlik@example.com',
    phone: '5551234567',
    company: 'Test Ltd.',
    status: 'Aktif',
    address: {
      street: 'Test Caddesi',
      city: 'İstanbul',
      state: 'Marmara',
      postalCode: '34000',
      country: 'Türkiye'
    }
  };
  
  let token;
  let customerId;
  let eventId;
  let testEvent;
  
  // Test öncesi kullanıcı oluştur ve giriş yap
  beforeAll(async () => {
    // Kullanıcıyı oluştur
    await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    // Giriş yap ve token al
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    token = loginResponse.body.token;
    
    // Müşteri oluştur
    const customerResponse = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send(testCustomer);
    
    customerId = customerResponse.body.data._id;
    
    // testEvent nesnesini tanımla
    testEvent = {
      title: 'Test Toplantısı',
      description: 'Yeni proje hakkında görüşme',
      type: 'toplanti',
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 gün sonra
      endDate: new Date(Date.now() + 25 * 60 * 60 * 1000),   // 1 gün + 1 saat sonra
      location: 'Şirket Merkezi, Toplantı Odası 2',
      customer: customerId,
      reminders: [
        { time: 60, type: 'email' }  // 1 saat önce hatırlat
      ],
      attendees: [
        { name: 'Ahmet Müşteri', email: 'ahmet.etkinlik@example.com' }
      ]
    };
  });
  
  // Yeni etkinlik oluşturma testi
  test('Yeni etkinlik oluşturulabilmeli', async () => {
    const response = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(testEvent);
    
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(testEvent.title);
    expect(response.body.data.type).toBe(testEvent.type);
    
    // Sonraki testler için eventId'yi kaydet
    eventId = response.body.data._id;
  });
  
  // Tüm etkinlikleri listeleme testi
  test('Tüm etkinlikler listelenebilmeli', async () => {
    const response = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
  
  // ID'ye göre etkinlik getirme testi
  test('ID\'ye göre etkinlik getirilebilmeli', async () => {
    const response = await request(app)
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(eventId);
  });
  
  // Etkinlik güncelleme testi
  test('Etkinlik güncellenebilmeli', async () => {
    const updates = {
      title: 'Güncellenmiş Toplantı',
      status: 'tamamlandi'
    };
    
    const response = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updates);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe(updates.title);
    expect(response.body.data.status).toBe(updates.status);
  });
  
  // Etkinlik istatistikleri testi
  test('Etkinlik istatistikleri alınabilmeli', async () => {
    const response = await request(app)
      .get('/api/events/stats')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.totalEvents).toBeGreaterThan(0);
    expect(response.body.data.typeStats).toBeDefined();
    expect(response.body.data.statusStats).toBeDefined();
  });
  
  // Etkinlik silme testi
  test('Etkinlik silinebilmeli', async () => {
    const response = await request(app)
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Silinen etkinliğin artık var olmadığını kontrol et
    const getResponse = await request(app)
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(getResponse.statusCode).toBe(404);
  });
}); 