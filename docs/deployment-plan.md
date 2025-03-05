# Derleme ve Deploy Planı

## Ortamlar
1. **Geliştirme (Development)**
   - Yerel geliştirme ortamı
   - Nodemon ile canlı yeniden yükleme
   - MongoDB yerel veritabanı

2. **Test (Testing)**
   - GitHub Actions ile CI/CD
   - Otomatik testler
   - MongoDB Atlas test veritabanı

3. **Üretim (Production)**
   - AWS EC2 / Azure / DigitalOcean
   - PM2 ile süreç yönetimi
   - MongoDB Atlas üretim veritabanı
   - Nginx önbellek ve ters proxy

## Dağıtım Süreçleri
1. **Geliştirme Ortamı Dağıtımı**
   ```
   npm run dev
   ```

2. **Test Ortamı Dağıtımı**
   ```
   npm test
   npm run build
   ```

3. **Üretim Ortamı Dağıtımı**
   ```
   npm run build
   npm run start:prod
   ```

## Ortam Değişkenleri
Her ortam için farklı .env dosyaları kullanılacak:
- .env.development
- .env.test
- .env.production

## Dağıtım Adımları
1. Kod incelemesi ve onayı
2. Testlerin çalıştırılması
3. Sürüm numarasının artırılması
4. Build işlemi
5. Deployment
6. Doğrulama testleri
7. Rollback planı (gerekirse) 