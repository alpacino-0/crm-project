require('dotenv').config();
const nodemailer = require('nodemailer');

// Transporter oluştur
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test e-postası gönder
async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: `"CRM Test" <${process.env.EMAIL_USER}>`,
      to: "yavuz484848@gmail.com", // Gerçek bir e-posta adresi girin
      subject: "CRM E-posta Testi",
      text: "Bu bir test e-postasıdır.",
      html: "<b>Bu bir test e-postasıdır.</b><p>E-posta gönderimi başarıyla test edildi!</p>"
    });

    console.log("E-posta gönderildi: %s", info.messageId);
    console.log("Önizleme URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("E-posta gönderilirken hata oluştu:", error);
  }
}

testEmail(); 