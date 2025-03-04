# Basit ve Özelleştirilebilir CRM Projesi Geliştirme Dokümanı

## 1. Proje Tanımı

Bu doküman, basit ve özelleştirilebilir bir CRM (Müşteri İlişkileri Yönetimi) sisteminin kurulumu ve temel bileşenlerini içermektedir. Sistem, müşteri takibi, teklif yönetimi, faturalandırma ve takvim planlaması gibi temel fonksiyonları destekleyecektir. Bu proje, küçük ve orta ölçekli işletmelerin müşteri ilişkilerini yönetmelerine yardımcı olmak için tasarlanmıştır.

## 2. Teknoloji Seçimi

### 2.1 Backend
- **Framework**: Node.js (Express.js)
- **Programlama Dili**: JavaScript/TypeScript
- **API Türü**: RESTful API

### 2.2 Veritabanı
- **Ana Veritabanı**: MongoDB (NoSQL)
  - Esneklik ve hızlı geliştirme için tercih edilmiştir
  - Mongoose ODM kullanılacaktır

### 2.3 Frontend
- **Framework**: React.js
- **State Yönetimi**: Redux Toolkit
- **UI Kütüphanesi**: Tailwind CSS & ShadCN UI
- **HTTP İstemcisi**: Axios

### 2.4 Kimlik Doğrulama ve Güvenlik
- **Token Tabanlı Doğrulama**: JWT (JSON Web Token)
- **Şifreleme**: bcrypt
- **İzin Kontrolü**: Rol tabanlı erişim kontrolü (RBAC)

### 2.5 Devops ve Dağıtım
- **Konteynerleştirme**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: AWS (EC2 veya Elastic Beanstalk) / Azure / DigitalOcean
- **SSL**: Let's Encrypt

## 3. Proje Mimarisi

### 3.1 Backend Mimarisi (Node.js/Express)

```
crm-backend/
├── src/
│   ├── config/              # Yapılandırma dosyaları
│   ├── controllers/         # İstek işleyicileri
│   ├── middleware/          # Ara yazılımlar (authentication, validation)
│   ├── models/              # Veritabanı şemaları
│   ├── routes/              # API route tanımları
│   ├── services/            # İş mantığı
│   ├── utils/               # Yardımcı fonksiyonlar
│   └── app.js               # Ana uygulama
├── tests/                   # Test dosyaları
├── .env                     # Ortam değişkenleri
├── package.json             # Proje bağımlılıkları
└── README.md                # Dokümantasyon
```

### 3.2 Frontend Mimarisi (React)

```
crm-frontend/
├── public/                  # Statik dosyalar
├── src/
│   ├── assets/              # Resimler, fontlar vb.
│   ├── components/          # Yeniden kullanılabilir bileşenler
│   │   ├── common/          # Genel bileşenler
│   │   ├── layout/          # Düzen bileşenleri
│   │   └── ui/              # UI bileşenleri
│   ├── features/            # Özellik modülleri
│   │   ├── auth/            # Kimlik doğrulama
│   │   ├── customers/       # Müşteri yönetimi
│   │   ├── invoices/        # Fatura yönetimi
│   │   ├── proposals/       # Teklif yönetimi
│   │   └── calendar/        # Takvim yönetimi
│   ├── hooks/               # Özel React kancaları
│   ├── pages/               # Sayfa bileşenleri
│   ├── services/            # API istemcileri
│   ├── store/               # Redux store ve slice'lar
│   ├── utils/               # Yardımcı fonksiyonlar
│   ├── App.js               # Ana uygulama bileşeni
│   └── index.js             # Uygulama girişi
├── .env                     # Ortam değişkenleri
├── package.json             # Proje bağımlılıkları
└── README.md                # Dokümantasyon
```

## 4. Temel Modüller ve Veri Modeli

### 4.1 Kullanıcı Yönetimi

**Veritabanı Şeması (User Model):**
```javascript
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'sales_rep', 'manager', 'user'],
    default: 'user'
  },
  department: { type: String },
  phone: { type: String },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**API Endpoint'leri:**
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Oturum açma
- `GET /api/auth/me` - Mevcut kullanıcı bilgilerini getirme
- `PUT /api/auth/profile` - Profil güncelleme
- `POST /api/auth/change-password` - Şifre değiştirme
- `POST /api/auth/forgot-password` - Şifre sıfırlama

### 4.2 Müşteri Yönetimi

**Veritabanı Şeması (Customer Model):**
```javascript
const customerSchema = new mongoose.Schema({
  companyName: { type: String },
  contactFirstName: { type: String, required: true },
  contactLastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String }
  },
  website: { type: String },
  industry: { type: String },
  size: { type: String },
  status: { 
    type: String, 
    enum: ['lead', 'prospect', 'customer', 'inactive'],
    default: 'lead'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**İletişim Geçmişi Şeması:**
```javascript
const interactionSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['call', 'email', 'meeting', 'note', 'other'],
    required: true
  },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  followUpDate: { type: Date },
  followUpAction: { type: String },
  createdAt: { type: Date, default: Date.now }
});
```

**API Endpoint'leri:**
- `GET /api/customers` - Tüm müşterileri listeleme
- `GET /api/customers/:id` - Tek bir müşteri detayı
- `POST /api/customers` - Yeni müşteri ekleme
- `PUT /api/customers/:id` - Müşteri güncelleme
- `DELETE /api/customers/:id` - Müşteri silme
- `GET /api/customers/:id/interactions` - Müşteri etkileşimlerini listeleme
- `POST /api/customers/:id/interactions` - Müşteri etkileşimi ekleme

### 4.3 Teklif Yönetimi

**Veritabanı Şeması (Proposal Model):**
```javascript
const proposalSchema = new mongoose.Schema({
  proposalNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  title: { type: String, required: true },
  description: { type: String },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'TRY' },
  taxRate: { type: Number, default: 18 },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
    default: 'draft'
  },
  validUntil: { type: Date, required: true },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true }
  }],
  notes: { type: String },
  terms: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**API Endpoint'leri:**
- `GET /api/proposals` - Tüm teklifleri listeleme
- `GET /api/proposals/:id` - Tek bir teklif detayı
- `POST /api/proposals` - Yeni teklif oluşturma
- `PUT /api/proposals/:id` - Teklif güncelleme
- `DELETE /api/proposals/:id` - Teklif silme
- `POST /api/proposals/:id/send` - Teklifi e-posta ile gönderme
- `PUT /api/proposals/:id/status` - Teklif durumunu güncelleme
- `GET /api/proposals/:id/download` - Teklifi PDF olarak indirme

### 4.4 Faturalandırma

**Veritabanı Şeması (Invoice Model):**
```javascript
const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  proposalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' },
  issueDate: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    amount: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'TRY' },
  notes: { type: String },
  paymentDetails: {
    method: { type: String },
    transactionId: { type: String },
    date: { type: Date },
    amount: { type: Number }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**API Endpoint'leri:**
- `GET /api/invoices` - Tüm faturaları listeleme
- `GET /api/invoices/:id` - Tek bir fatura detayı
- `POST /api/invoices` - Yeni fatura oluşturma
- `PUT /api/invoices/:id` - Fatura güncelleme
- `DELETE /api/invoices/:id` - Fatura silme
- `POST /api/invoices/:id/send` - Faturayı e-posta ile gönderme
- `PUT /api/invoices/:id/status` - Fatura durumunu güncelleme
- `POST /api/invoices/:id/payment` - Faturaya ödeme kaydetme
- `GET /api/invoices/:id/download` - Faturayı PDF olarak indirme

### 4.5 Takvim Planlaması

**Veritabanı Şeması (Calendar Event Model):**
```javascript
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  location: { type: String },
  eventType: { 
    type: String, 
    enum: ['meeting', 'call', 'task', 'reminder', 'other'],
    default: 'meeting'
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  participants: [{
    type: { 
      type: String, 
      enum: ['user', 'customer', 'external'],
      required: true
    },
    id: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, required: true },
    email: { type: String, required: true }
  }],
  notifyBefore: { type: Number }, // Dakika cinsinden bildirim süresi
  recurrence: {
    type: { 
      type: String, 
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none'
    },
    interval: { type: Number, default: 1 },
    endDate: { type: Date }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**API Endpoint'leri:**
- `GET /api/events` - Tüm etkinlikleri listeleme
- `GET /api/events/:id` - Tek bir etkinlik detayı
- `POST /api/events` - Yeni etkinlik oluşturma
- `PUT /api/events/:id` - Etkinlik güncelleme
- `DELETE /api/events/:id` - Etkinlik silme
- `POST /api/events/:id/invite` - Etkinliğe davet gönderme
- `PUT /api/events/:id/status` - Etkinlik durumunu güncelleme

## 5. Frontend Bileşenleri

### 5.1 Ana Ekranlar ve Bileşenler

- **Giriş ve Kayıt Ekranları**
  - Giriş Formu
  - Kayıt Formu
  - Şifre Sıfırlama Formu

- **Gösterge Paneli (Dashboard)**
  - Özet İstatistikler
  - Aktivite Akışı
  - Yaklaşan Etkinlikler
  - Son Eklenen Müşteriler
  - Bekleyen Teklifler
  - Vadesi Gelen Faturalar

- **Müşteri Yönetimi**
  - Müşteri Listesi ve Filtreleme
  - Müşteri Detay Sayfası
  - Müşteri Ekleme/Düzenleme Formu
  - Müşteri Etkileşim Kaydı
  - Müşteri Segmentasyonu ve Etiketleme

- **Teklif Yönetimi**
  - Teklif Listesi ve Filtreleme
  - Teklif Oluşturma/Düzenleme Formu
  - Teklif Önizleme
  - Teklif Durumu Takibi
  - Teklif PDF Oluşturma

- **Fatura Yönetimi**
  - Fatura Listesi ve Filtreleme
  - Fatura Oluşturma/Düzenleme Formu
  - Fatura Önizleme
  - Ödeme Kaydetme
  - Fatura PDF Oluşturma

- **Takvim**
  - Ay/Hafta/Gün Görünümleri
  - Etkinlik Oluşturma/Düzenleme
  - Etkinlik Hatırlatıcıları
  - Drag-and-Drop Planlamacı
  - Google Calendar/Outlook Senkronizasyonu

- **Kullanıcı Yönetimi (Admin)**
  - Kullanıcı Listesi
  - Kullanıcı Ekleme/Düzenleme Formu
  - Rol ve İzin Ayarları

### 5.2 Genel UI Bileşenleri

- Navigasyon Çubuğu (Navbar)
- Kenar Çubuğu (Sidebar)
- Veri Tabloları ve Sayfalama
- Arama ve Filtreleme Komponentleri
- Form Bileşenleri
- Modal/Dialog Pencereleri
- Bildirim Sistemi
- Dosya Yükleme ve Görüntüleme
- Veri Görselleştirme (Grafikler, Pasta Dilimleri)

## 6. Kurulum Adımları

### 6.1 Backend Kurulumu (Windows için)

1. Node.js yükleyin (https://nodejs.org)
2. MongoDB kurulumu (İki seçenek var):
   - MongoDB Compass indirip kurabilirsiniz: https://www.mongodb.com/try/download/compass
   - MongoDB Atlas'ta (bulut hizmeti) ücretsiz bir hesap açabilirsiniz

3. Proje klasörü oluşturun ve içine girin:
   ```cmd
   mkdir crm-backend
   cd crm-backend
   ```

4. Node.js projesini başlatın:
   ```cmd
   npm init -y
   ```

5. Gerekli paketleri yükleyin:
   ```cmd
   npm install express mongoose bcrypt jsonwebtoken cors dotenv helmet morgan validator multer pdfkit nodemailer
   npm install --save-dev nodemon jest supertest
   ```

6. Proje yapısını oluşturun (aşağıdaki dizinleri manuel olarak oluşturabilirsiniz):
   ```cmd
   mkdir src src\config src\controllers src\middleware src\models src\routes src\services src\utils tests
   ```

7. `package.json` dosyasını düzenleyin:
   ```json
   "scripts": {
     "start": "node src/app.js",
     "dev": "nodemon src/app.js",
     "test": "jest"
   }
   ```

8. `.env` dosyası oluşturun:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/crm_db
   JWT_SECRET=your_secret_key
   NODE_ENV=development
   ```

9. Geliştirmeyi başlatın:
   ```cmd
   npm run dev
   ```

### 6.2 Frontend Kurulumu (Windows için)

1. React projesini oluşturun:
   ```cmd
   npx create-react-app crm-frontend
   cd crm-frontend
   ```

2. Gerekli paketleri yükleyin:
   ```cmd
   npm install axios react-router-dom redux react-redux @reduxjs/toolkit tailwindcss
   npm install react-datepicker react-table recharts @react-pdf/renderer
   ```

3. Tailwind CSS'i yapılandırın:
   ```cmd
   npx tailwindcss init -p
   ```

4. `tailwind.config.js` dosyasını düzenleyin:
   ```js
   module.exports = {
     content: ["./src/**/*.{js,jsx,ts,tsx}"],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

5. ShadCN UI veya başka bir UI kütüphanesi ekleyin

6. `.env` dosyası oluşturun:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

7. Projeyi başlatın:
   ```cmd
   npm start
   ```

## 7. Güvenlik ve En İyi Uygulamalar

### 7.1 Backend Güvenlik Önlemleri

- Helmet.js kullanarak HTTP güvenlik başlıkları ekleyin
- Rate limiting uygulayın (aşırı istek koruması)
- JWT token'larını güvenli şekilde saklayın ve düzenli yenileyin
- CORS politikalarını sıkılaştırın
- Giriş denemelerini sınırlayın ve başarısız girişleri izleyin
- Tüm kullanıcı girdilerini doğrulayın ve sanitize edin (XSS koruması)
- MongoDB enjeksiyon saldırılarına karşı önlem alın
- Veritabanı bağlantı bilgilerini ve hassas bilgileri .env dosyasında saklayın
- Güvenli şifre politikaları uygulayın

### 7.2 Frontend Güvenlik Önlemleri

- JWT token'larını HTTP-only cookie olarak saklayın (mümkünse)
- Redux store'da hassas bilgileri saklamaktan kaçının
- React formlarında doğrulama uygulayın
- CSRF token'larını uygulayın
- XSS koruması için React'in yerleşik sanitizasyonunu kullanın
- API isteklerini ve yanıtlarını doğrulayın

## 8. Test Stratejisi

### 8.1 Backend Testleri

- **Birim Testleri**: Jest ile servis ve yardımcı fonksiyonları test edin
- **Entegrasyon Testleri**: Supertest ile API endpoint'lerini test edin
- **Veritabanı Testleri**: MongoDB Memory Server ile veritabanı işlemlerini test edin

### 8.2 Frontend Testleri

- **Birim Testleri**: React Testing Library ile bileşenleri test edin
- **Entegrasyon Testleri**: Kullanıcı etkileşimlerini test edin
- **E2E Testleri**: Cypress ile kullanıcı deneyimini test edin

## 9. Deployment

### 9.1 Docker ile Konteynerleştirme

1. Backend için Dockerfile oluşturun:
   ```Dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install --production
   COPY . .
   EXPOSE 5000
   CMD ["node", "src/app.js"]
   ```

2. Frontend için Dockerfile oluşturun:
   ```Dockerfile
   FROM node:18-alpine AS build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=build /app/build /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

3. Docker Compose ile tüm servisleri birleştirin:
   ```yaml
   version: '3'
   services:
     mongodb:
       image: mongo
       ports:
         - "27017:27017"
       volumes:
         - mongo-data:/data/db
       restart: always

     backend:
       build: ./crm-backend
       ports:
         - "5000:5000"
       depends_on:
         - mongodb
       environment:
         - MONGODB_URI=mongodb://mongodb:27017/crm_db
         - PORT=5000
         - JWT_SECRET=your_secret_key
       restart: always

     frontend:
       build: ./crm-frontend
       ports:
         - "80:80"
       depends_on:
         - backend
       restart: always

   volumes:
     mongo-data:
   ```

4. Sistemi başlatın:
   ```cmd
   docker-compose up -d
   ```

### 9.2 Bulut Deployment

- **AWS EC2**: Windows Server üzerinde Node.js ve Docker çalıştırma
- **Azure App Service**: .NET Core ve Node.js destekli Windows hostingi
- **DigitalOcean Droplet**: Linux tabanlı VPS üzerinde uygulama çalıştırma

## 10. Geliştirme Yol Haritası

### 10.1 Temel Sürüm (MVP)
- Kullanıcı kimlik doğrulama ve yetkilendirme
- Temel müşteri yönetimi
- Basit teklif ve fatura oluşturma
- Temel takvim yönetimi

### 10.2 Versiyon 1.0
- Gelişmiş müşteri segmentasyonu
- Teklif ve fatura şablonları
- Çoklu dil desteği
- İleri düzey raporlama ve analizler

### 10.3 Versiyon 2.0
- Otomasyon ve iş akışları
- E-posta pazarlama entegrasyonu
- Mobil uygulama (React Native)
- Çevrimdışı çalışma modu
- Senkronizasyon ve veri yedekleme

### 10.4 İleri Sürüm Özellikleri
- Yapay zeka destekli müşteri analizi
- Satış tahminleme
- Otomatik lead puanlama
- İleri düzey entegrasyonlar (ERP, E-ticaret sistemleri)
- Çok şubeli işletme desteği

