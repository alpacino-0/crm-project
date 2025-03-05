const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Rotaları içe aktarma
const customerRoutes = require('./routes/customer.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const interactionRoutes = require('./routes/interaction.routes');
const proposalRoutes = require('./routes/proposal.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const eventRoutes = require('./routes/event.routes');

// Rotaları kullanma
app.use('/api/customers', customerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/events', eventRoutes);

// Ana rota
app.get('/', (req, res) => {
  res.send('CRM API çalışıyor!');
});

// Bağlantı noktası ayarı
const PORT = process.env.PORT || 5000;

// MongoDB bağlantısı
const MONGODB_URI = process.env.NODE_ENV === 'test' 
  ? process.env.MONGODB_URI_TEST 
  : process.env.MONGODB_URI;

mongoose.set('strictQuery', false);

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Test ortamında değilse sunucuyu başlat
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} numaralı portta çalışıyor`);
  });
}

const scheduler = require('./services/scheduler.service');

// Scheduler'ı başlat (sadece production ve development ortamlarında)
if (process.env.NODE_ENV !== 'test') {
  scheduler.scheduleEventReminders();
}

module.exports = app; 
