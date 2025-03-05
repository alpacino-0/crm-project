const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Geliştirme ortamında kullanılacak test hesabı
  let transporter;
  
  if (process.env.NODE_ENV === 'development') {
    // Ethereal test hesabı oluştur (test için)
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } else {
    // Gerçek e-posta sağlayıcısı (üretim için)
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  // E-posta gönder
  const mailOptions = {
    from: `"CRM Sistemi" <${process.env.EMAIL_FROM || 'noreply@crm-project.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };
  
  const info = await transporter.sendMail(mailOptions);
  
  // Geliştirme ortamında test e-postasına erişim URL'sini göster
  if (process.env.NODE_ENV === 'development') {
    console.log('E-posta Önizleme URL:', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

module.exports = sendEmail; 
