const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Customer = require('../src/models/customer.model');
const User = require('../src/models/user.model');

// Test öncesi ve sonrası işlemler
beforeAll(async () => {
  // Test veritabanına bağlan
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/crm-test');
  
  // Test veritabanını temizle
  await Customer.deleteMany({});
});

afterAll(async () => {
  // Bağlantıyı kapat
  await mongoose.connection.close();
});

describe('Müşteri API Testleri', () => {
  // Test için kimlik bilgileri
  const testUser = {
    firstName: 'Test',
    lastName: 'Admin',
    email: 'admin@example.com',
    password: 'Admin123456',
    role: 'admin'
  };
  
  const testCustomer = {
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    email: 'ahmet@example.com',
    phone: '5551234567',
    company: 'ABC Şirketi',
    status: 'Aktif',
    source: 'Web Sitesi',
    tags: ['önemli', 'yeni']
  };
  
  // Test için token ve müşteri ID'si
  let token;
  let customerId;
  
  // Test öncesi kullanıcı oluştur ve giriş yap
  beforeAll(async () => {
    // Kullanıcıyı oluştur
    await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    // Giriş yap ve token al
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    token = loginRes.body.token;
  });
  
  // Yeni müşteri oluşturma testi
  test('Yeni müşteri oluşturulabilmeli', async () => {
    const response = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${token}`)
      .send(testCustomer);
    
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(testCustomer.email);
    
    // Müşteri ID'sini sakla
    customerId = response.body.data._id;
  });
  
  // Tüm müşterileri getirme testi
  test('Tüm müşteriler listelenebilmeli', async () => {
    const response = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
  
  // Bir müşteriyi ID'ye göre getirme testi
  test('Müşteri ID\'ye göre getirilebilmeli', async () => {
    const response = await request(app)
      .get(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(customerId);
  });
  
  // Müşteri filtreleme testi
  test('Müşteriler filtrelenebilmeli', async () => {
    const response = await request(app)
      .get('/api/customers?status=Aktif&source=Web Sitesi')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].status).toBe('Aktif');
    expect(response.body.data[0].source).toBe('Web Sitesi');
  });
  
  // Müşteri arama testi
  test('Müşteriler aranabilmeli', async () => {
    const response = await request(app)
      .get('/api/customers?search=Ahmet')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].firstName).toBe('Ahmet');
  });
  
  // Müşteri güncelleme testi
  test('Müşteri güncellenebilmeli', async () => {
    const updateData = {
      company: 'XYZ Şirketi',
      status: 'Potansiyel',
      tags: ['önemli', 'takip-et']
    };
    
    const response = await request(app)
      .put(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.company).toBe(updateData.company);
    expect(response.body.data.status).toBe(updateData.status);
    expect(response.body.data.tags).toEqual(expect.arrayContaining(updateData.tags));
  });
  
  // Müşteri istatistikleri testi
  test('Müşteri istatistikleri alınabilmeli', async () => {
    const response = await request(app)
      .get('/api/customers/stats')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.total).toBeGreaterThan(0);
    expect(response.body.data.byStatus).toBeDefined();
    expect(response.body.data.bySource).toBeDefined();
  });
  
  // Müşteri silme testi
  test('Müşteri silinebilmeli', async () => {
    const response = await request(app)
      .delete(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('başarıyla silindi');
    
    // Silinen müşteriyi kontrol et
    const deletedCustomer = await request(app)
      .get(`/api/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(deletedCustomer.statusCode).toBe(404);
  });
}); 