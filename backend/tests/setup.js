const mongoose = require('mongoose');
require('@jest/globals');

// Test ortam değişkenlerini ayarla
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI_TEST = 'mongodb://localhost:27017/crm-test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '5001'; // Test için farklı port 

// Test tamamlandığında çalışacak - artık doğrudan global afterAll fonksiyonunu kullanabiliriz
afterAll(async () => {
    await mongoose.connection.close();
});