const nodemailer = require('nodemailer');
const fs = require('fs');

/**
 * E-posta göndermek için kullanılan servis
 */
class EmailService {
  constructor() {
    // Nodemailer transporter oluştur
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Geliştirme ortamında otomatik log alma
    if (process.env.NODE_ENV === 'development') {
      this.transporter.use('compile', (mail, callback) => {
        console.log('E-posta gönderimi:', {
          from: mail.data.from,
          to: mail.data.to,
          subject: mail.data.subject,
        });
        callback();
      });
    }
  }

  /**
   * Teklif gönderme e-postası
   * @param {Object} options - E-posta gönderim seçenekleri
   * @param {String} options.to - Alıcı e-posta adresi
   * @param {String} options.customerName - Müşteri adı
   * @param {String} options.proposalNumber - Teklif numarası
   * @param {String} options.pdfPath - PDF dosyasının yolu
   * @param {String} options.amount - Teklif tutarı
   * @param {String} options.currency - Para birimi
   * @param {String} options.validUntil - Geçerlilik tarihi
   * @param {String} options.customMessage - Özel mesaj
   * @returns {Promise} - Gönderim sonucu
   */
  async sendProposal(options) {
    const {
      to,
      customerName,
      proposalNumber,
      pdfPath,
      amount,
      currency,
      validUntil,
      customMessage = ''
    } = options;

    // E-posta içeriği
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Sayın ${customerName},</h2>
        <p>Talebiniz üzerine hazırladığımız <strong>${proposalNumber}</strong> numaralı teklifimizi ekte bulabilirsiniz.</p>
        <p>Teklif Tutarı: <strong>${amount} ${currency}</strong></p>
        <p>Geçerlilik Tarihi: <strong>${new Date(validUntil).toLocaleDateString('tr-TR')}</strong></p>
        
        ${customMessage ? `<p>${customMessage}</p>` : ''}
        
        <p>Teklifimizle ilgili sorularınız için bize ulaşmaktan çekinmeyin.</p>
        <p>Saygılarımızla,<br>${process.env.COMPANY_NAME || 'Şirketimiz'}</p>
      </div>
    `;

    // E-posta gönder
    try {
      let attachments = [];
      
      if (pdfPath && fs.existsSync(pdfPath)) {
        attachments.push({
          filename: `Teklif_${proposalNumber}.pdf`,
          path: pdfPath
        });
      }
      
      const result = await this.transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || 'Şirketimiz'}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Teklif: ${proposalNumber}`,
        html,
        attachments
      });
      
      return result;
    } catch (error) {
      throw new Error(`E-posta gönderilirken hata: ${error.message}`);
    }
  }

  /**
   * Fatura gönderme e-postası
   * @param {Object} options - E-posta gönderim seçenekleri
   * @param {String} options.to - Alıcı e-posta adresi
   * @param {String} options.customerName - Müşteri adı
   * @param {String} options.invoiceNumber - Fatura numarası
   * @param {String} options.pdfPath - PDF dosyasının yolu
   * @param {String} options.amount - Fatura tutarı
   * @param {String} options.currency - Para birimi
   * @param {String} options.dueDate - Son ödeme tarihi
   * @param {String} options.customMessage - Özel mesaj
   * @returns {Promise} - Gönderim sonucu
   */
  async sendInvoice(options) {
    const {
      to,
      customerName,
      invoiceNumber,
      pdfPath,
      amount,
      currency,
      dueDate,
      customMessage = ''
    } = options;

    // E-posta içeriği
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Sayın ${customerName},</h2>
        <p><strong>${invoiceNumber}</strong> numaralı faturanızı ekte bulabilirsiniz.</p>
        <p>Fatura Tutarı: <strong>${amount} ${currency}</strong></p>
        <p>Son Ödeme Tarihi: <strong>${new Date(dueDate).toLocaleDateString('tr-TR')}</strong></p>
        
        ${customMessage ? `<p>${customMessage}</p>` : ''}
        
        <p>Faturanızla ilgili sorularınız için bize ulaşmaktan çekinmeyin.</p>
        <p>Saygılarımızla,<br>${process.env.COMPANY_NAME || 'Şirketimiz'}</p>
      </div>
    `;

    // E-posta gönder
    try {
      let attachments = [];
      
      if (pdfPath && fs.existsSync(pdfPath)) {
        attachments.push({
          filename: `Fatura_${invoiceNumber}.pdf`,
          path: pdfPath
        });
      }
      
      const result = await this.transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || 'Şirketimiz'}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Fatura: ${invoiceNumber}`,
        html,
        attachments
      });
      
      return result;
    } catch (error) {
      throw new Error(`E-posta gönderilirken hata: ${error.message}`);
    }
  }

  /**
   * Ödeme hatırlatıcı e-postası
   * @param {Object} options - E-posta gönderim seçenekleri
   * @param {String} options.to - Alıcı e-posta adresi
   * @param {String} options.customerName - Müşteri adı
   * @param {String} options.invoiceNumber - Fatura numarası
   * @param {String} options.pdfPath - PDF dosyasının yolu
   * @param {String} options.amount - Fatura tutarı
   * @param {String} options.currency - Para birimi
   * @param {String} options.dueDate - Son ödeme tarihi
   * @param {Number} options.daysOverdue - Gecikme gün sayısı
   * @returns {Promise} - Gönderim sonucu
   */
  async sendPaymentReminder(options) {
    const {
      to,
      customerName,
      invoiceNumber,
      pdfPath,
      amount,
      currency,
      dueDate,
      daysOverdue
    } = options;

    // E-posta içeriği
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Sayın ${customerName},</h2>
        <p>Bu e-posta, <strong>${invoiceNumber}</strong> numaralı faturanızın ödeme hatırlatıcısı olarak gönderilmiştir.</p>
        <p>Fatura Tutarı: <strong>${amount} ${currency}</strong></p>
        <p>Son Ödeme Tarihi: <strong>${new Date(dueDate).toLocaleDateString('tr-TR')}</strong></p>
        <p style="color: red;">Gecikme: <strong>${daysOverdue} gün</strong></p>
        
        <p>Faturanız ödemeniz beklemektedir. En kısa sürede ödemenizi yapmanızı rica ederiz.</p>
        <p>Ödemelerinizi aşağıdaki banka hesabımıza yapabilirsiniz:</p>
        <p>
          Banka: ${process.env.BANK_NAME || 'Banka Adı'}<br>
          IBAN: ${process.env.BANK_IBAN || 'IBAN numarası'}<br>
          Hesap Sahibi: ${process.env.COMPANY_NAME || 'Şirket Adı'}
        </p>
        
        <p>Ödeme ile ilgili sorularınız için bize ulaşmaktan çekinmeyin.</p>
        <p>Saygılarımızla,<br>${process.env.COMPANY_NAME || 'Şirketimiz'}</p>
      </div>
    `;

    // E-posta gönder
    try {
      let attachments = [];
      
      if (pdfPath && fs.existsSync(pdfPath)) {
        attachments.push({
          filename: `Fatura_${invoiceNumber}.pdf`,
          path: pdfPath
        });
      }
      
      const result = await this.transporter.sendMail({
        from: `"${process.env.COMPANY_NAME || 'Şirketimiz'}" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Ödeme Hatırlatıcı: Fatura ${invoiceNumber}`,
        html,
        attachments
      });
      
      return result;
    } catch (error) {
      throw new Error(`E-posta gönderilirken hata: ${error.message}`);
    }
  }
}

// Servis örneğini oluştur ve dışa aktar
const emailService = new EmailService();
module.exports = emailService; 
