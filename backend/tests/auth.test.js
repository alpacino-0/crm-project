const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');

// Test öncesi ve sonrası
beforeAll(async () => {
  // Test veritabanına bağlan
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/crm-test');
  
  // Test veritabanını temizle
  await User.deleteMany({});
});

afterAll(async () => {
  // Bağlantıyı kapat
  await mongoose.connection.close();
});

describe('Kimlik Doğrulama API Testleri', () => {
  // Test kullanıcısı
  const testUser = {
    firstName: 'Test',
    lastName: 'Kullanıcı',
    email: 'test@example.com',
    password: 'Test123456'
  };
  
  // Token saklamak için değişken
  let token;
  
  // Kayıt olma testi
  test('Kullanıcı kaydı yapabilmeli', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
      
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(testUser.email);
  });
  
  // Aynı e-posta ile kayıt olamama testi
  test('Aynı e-posta ile kayıt olamamalı', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);
      
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('Bu e-posta adresi zaten kullanılıyor');
  });
  
  // Giriş yapma testi
  test('Kullanıcı giriş yapabilmeli', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
      
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    
    // Token'ı sakla
    token = response.body.token;
  });
  
  // Yanlış kimlik bilgileriyle giriş yapamama testi
  test('Yanlış kimlik bilgileriyle giriş yapamamalı', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'yanlışşifre'
      });
      
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Geçersiz kimlik bilgileri');
  });
  
  // Profil bilgilerini alma testi
  test('Kullanıcı kendi profilini görebilmeli', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
      
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe(testUser.email);
  });
  
  // Yetkisiz erişim testi
  test('Yetkisiz erişim engellenmeli', async () => {
    const response = await request(app)
      .get('/api/auth/me');
      
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toContain('Bu kaynağa erişim için giriş yapmalısınız');
  });
}); 