const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Proposal = require('../src/models/proposal.model');
const Customer = require('../src/models/customer.model');
const User = require('../src/models/user.model');

// Test öncesi ve sonrası işlemler
beforeAll(async () => {
  // Test veritabanına bağlan
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/crm-test');
  
  // Test veritabanını temizle
  await Proposal.deleteMany({});
  await Customer.deleteMany({});
  await User.deleteMany({});
});

afterAll(async () => {
  // Bağlantıyı kapat
  await mongoose.connection.close();
});

describe('Teklif API Testleri', () => {
  // Test için kimlik bilgileri
  const testUser = {
    firstName: 'Test',
    lastName: 'Kullanıcı',
    email: 'test.proposal@example.com',
    password: 'Test123456',
    role: 'user'
  };
  
  const testCustomer = {
    firstName: 'Ahmet',
    lastName: 'Müşteri',
    email: 'ahmet.teklif@example.com',
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
  let proposalId;
  let testProposal; // Burada sadece değişkeni tanımlıyoruz, değer atamıyoruz
  
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
    
    // testProposal nesnesini tanımla
    testProposal = {
      customer: customerId,
      proposalNumber: "TKL-" + Date.now(),  // Otomatik teklif numarası oluştur
      issueDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Taslak',
      items: [
        {
          name: 'Web Sitesi Tasarımı',
          description: 'Kurumsal web sitesi geliştirme hizmeti',
          quantity: 1,
          unitPrice: 5000,
          taxRate: 18,
          discount: 0
        },
        {
          name: 'SEO Hizmeti',
          description: '3 aylık SEO çalışması',
          quantity: 1,
          unitPrice: 2000,
          taxRate: 18,
          discount: 10
        }
      ],
      notes: 'Test notları',
      terms: 'Ödeme 15 gün içinde yapılmalıdır.',
      currency: 'USD'  // TL yerine geçerli bir para birimi (USD, EUR, GBP vb.)
    };
  });

  
  // Yeni teklif oluşturma testi
  test('Yeni teklif oluşturulabilmeli', async () => {
    const response = await request(app)
      .post('/api/proposals')
      .set('Authorization', `Bearer ${token}`)
      .send(testProposal);
    
    console.log('Teklif oluşturma yanıtı:', response.body); // Hatayı görmek için
    
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.customer).toBeDefined();
    
    // Teklif ID'sini sakla
    proposalId = response.body.data._id;
  });
  
  // Tüm teklifleri getirme testi
  test('Tüm teklifler listelenebilmeli', async () => {
    const response = await request(app)
      .get('/api/proposals')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });
  
  // ID'ye göre teklif getirme testi
  test('ID\'ye göre teklif getirilebilmeli', async () => {
    const response = await request(app)
      .get(`/api/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(proposalId);
  });
  
  // Teklif güncelleme testi
  test('Teklif güncellenebilmeli', async () => {
    const updates = {
      status: 'Gönderildi',
      notes: 'Güncellenmiş test notları'
    };
    
    const response = await request(app)
      .put(`/api/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updates);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe(updates.status);
    expect(response.body.data.notes).toBe(updates.notes);
  });
  
  // Teklif PDF oluşturma testi
  test('Teklif PDF olarak oluşturulabilmeli', async () => {
    const response = await request(app)
      .get(`/api/proposals/${proposalId}/generate-pdf`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.pdfPath).toBeDefined();
  });
  
  // Teklif istatistikleri testi
  test('Teklif istatistikleri alınabilmeli', async () => {
    const response = await request(app)
      .get('/api/proposals/stats')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });
  
  // Teklif silme testi
  test('Teklif silinebilmeli', async () => {
    const response = await request(app)
      .delete(`/api/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('silindi');
    
    // Silinen teklifi kontrol et
    const deletedProposal = await request(app)
      .get(`/api/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(deletedProposal.statusCode).toBe(404);
  });
}); 