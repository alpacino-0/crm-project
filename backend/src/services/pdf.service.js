const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Teklif veya fatura için PDF dosyası oluşturur
 * @param {Object} document - Teklif veya fatura belgesi
 * @param {String} type - Belge tipi ('proposal' veya 'invoice')
 * @param {Object} customer - Müşteri bilgileri
 * @returns {Promise<String>} - Oluşturulan PDF dosyasının yolu
 */
const generatePDF = async (document, type, customer) => {
  try {
    // Belge tipine göre başlık ve diğer metin içeriklerini ayarla
    const isProposal = type === 'proposal';
    const title = isProposal ? 'TEKLİF' : 'FATURA';
    const docNumber = isProposal ? document.proposalNumber : document.invoiceNumber;
    const dateLabel = isProposal ? 'Teklif Tarihi:' : 'Fatura Tarihi:';
    const validityLabel = isProposal ? 'Geçerlilik Tarihi:' : 'Son Ödeme Tarihi:';
    const validityDate = isProposal ? document.validUntil : document.dueDate;
    
    // PDF dosyası oluştur
    const doc = new PDFDocument({ margin: 50 });
    
    // Dosya kayıt yolunu belirle
    const uploadsDir = path.join(__dirname, '../../uploads/pdf');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const fileName = `${type}_${docNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    
    // PDF dosyası olarak yaz
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Firma logosu ekle (varsa)
    const logoPath = path.join(__dirname, '../../public/images/logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 45, { width: 150 });
    }
    
    // Başlık
    doc
      .fontSize(25)
      .font('Helvetica-Bold')
      .text(title, 300, 50, { align: 'right' });
    
    // Belge numarası
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(docNumber, 300, 80, { align: 'right' });
    
    // Tarih bilgileri
    doc
      .fontSize(10)
      .text(`${dateLabel} ${new Date(document.issueDate).toLocaleDateString('tr-TR')}`, 300, 95, { align: 'right' })
      .text(`${validityLabel} ${new Date(validityDate).toLocaleDateString('tr-TR')}`, 300, 110, { align: 'right' });
    
    // Yatay çizgi
    doc
      .moveTo(50, 130)
      .lineTo(550, 130)
      .stroke();
    
    // Müşteri bilgileri
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('Müşteri Bilgileri:', 50, 150);
    
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`${customer.firstName} ${customer.lastName}`, 50, 170)
      .text(customer.company || '', 50, 185)
      .text(customer.email, 50, 200)
      .text(customer.phone || '', 50, 215);
    
    if (customer.address) {
      doc.text(customer.address.street || '', 50, 230)
        .text(`${customer.address.city || ''} ${customer.address.postalCode || ''}`, 50, 245)
        .text(customer.address.country || '', 50, 260);
    }
    
    // Ürün/hizmet tablosu başlığı
    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('Ürünler/Hizmetler:', 50, 290);
    
    // Tablo başlıkları
    const tableTop = 320;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Ürün/Hizmet', 50, tableTop)
      .text('Açıklama', 200, tableTop)
      .text('Miktar', 300, tableTop, { width: 50, align: 'right' })
      .text('Birim Fiyat', 350, tableTop, { width: 80, align: 'right' })
      .text('Vergi (%)', 430, tableTop, { width: 50, align: 'right' })
      .text('Toplam', 480, tableTop, { width: 70, align: 'right' });
    
    // Tablo çizgisi
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();
    
    // Kalemler
    let y = tableTop + 30;
    document.items.forEach((item) => {
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(item.name, 50, y, { width: 140 })
        .text(item.description || '', 200, y, { width: 90 })
        .text(item.quantity.toString(), 300, y, { width: 50, align: 'right' })
        .text(`${item.unitPrice.toFixed(2)} ${document.currency}`, 350, y, { width: 80, align: 'right' })
        .text(`%${item.taxRate.toFixed(2)}`, 430, y, { width: 50, align: 'right' });
      
      // Kalem toplamı
      const subtotal = item.quantity * item.unitPrice;
      const discount = subtotal * (item.discount / 100);
      const afterDiscount = subtotal - discount;
      const tax = afterDiscount * (item.taxRate / 100);
      const total = afterDiscount + tax;
      
      doc.text(`${total.toFixed(2)} ${document.currency}`, 480, y, { width: 70, align: 'right' });
      
      y += 20;
      
      // Sayfa sınırına yaklaşıldığında yeni sayfa ekle
      if (y > 700) {
        doc.addPage();
        y = 50;
        
        // Yeni sayfada tablo başlıkları
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Ürün/Hizmet', 50, y)
          .text('Açıklama', 200, y)
          .text('Miktar', 300, y, { width: 50, align: 'right' })
          .text('Birim Fiyat', 350, y, { width: 80, align: 'right' })
          .text('Vergi (%)', 430, y, { width: 50, align: 'right' })
          .text('Toplam', 480, y, { width: 70, align: 'right' });
        
        // Tablo çizgisi
        doc
          .moveTo(50, y + 15)
          .lineTo(550, y + 15)
          .stroke();
        
        y += 30;
      }
    });
    
    // Alt toplam, vergi ve genel toplam
    const summaryY = y + 20;
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Ara Toplam:', 350, summaryY, { width: 100, align: 'right' })
      .font('Helvetica')
      .text(`${document.subtotal.toFixed(2)} ${document.currency}`, 450, summaryY, { width: 100, align: 'right' });
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('İndirim:', 350, summaryY + 20, { width: 100, align: 'right' })
      .font('Helvetica')
      .text(`${document.discountTotal.toFixed(2)} ${document.currency}`, 450, summaryY + 20, { width: 100, align: 'right' });
    
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Vergi Toplamı:', 350, summaryY + 40, { width: 100, align: 'right' })
      .font('Helvetica')
      .text(`${document.taxTotal.toFixed(2)} ${document.currency}`, 450, summaryY + 40, { width: 100, align: 'right' });
    
    // Yatay çizgi
    doc
      .moveTo(350, summaryY + 60)
      .lineTo(550, summaryY + 60)
      .stroke();
    
    // Genel toplam
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('GENEL TOPLAM:', 350, summaryY + 70, { width: 100, align: 'right' })
      .text(`${document.grandTotal.toFixed(2)} ${document.currency}`, 450, summaryY + 70, { width: 100, align: 'right' });
    
    // Fatura için ödeme bilgileri ekle
    if (!isProposal) {
      const paymentY = summaryY + 100;
      
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('Ödeme Bilgileri:', 50, paymentY);
      
      if (document.payments && document.payments.length > 0) {
        let paymentTableY = paymentY + 25;
        
        // Ödeme tablosu başlıkları
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Tarih', 50, paymentTableY)
          .text('Tutar', 200, paymentTableY, { width: 80, align: 'right' })
          .text('Ödeme Yöntemi', 300, paymentTableY)
          .text('Notlar', 400, paymentTableY);
        
        // Tablo çizgisi
        doc
          .moveTo(50, paymentTableY + 15)
          .lineTo(550, paymentTableY + 15)
          .stroke();
        
        paymentTableY += 25;
        document.payments.forEach(payment => {
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(new Date(payment.date).toLocaleDateString('tr-TR'), 50, paymentTableY)
            .text(`${payment.amount.toFixed(2)} ${document.currency}`, 200, paymentTableY, { width: 80, align: 'right' })
            .text(payment.method, 300, paymentTableY)
            .text(payment.notes || '', 400, paymentTableY);
          
          paymentTableY += 20;
        });
        
        // Toplam ödenen ve kalan
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Toplam Ödenen:', 350, paymentTableY + 10, { width: 100, align: 'right' })
          .font('Helvetica')
          .text(`${document.paidTotal.toFixed(2)} ${document.currency}`, 450, paymentTableY + 10, { width: 100, align: 'right' });
        
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Kalan Tutar:', 350, paymentTableY + 30, { width: 100, align: 'right' })
          .font('Helvetica')
          .text(`${document.dueAmount.toFixed(2)} ${document.currency}`, 450, paymentTableY + 30, { width: 100, align: 'right' });
      } else {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text('Henüz ödeme kaydı bulunmamaktadır.', 50, paymentY + 25);
        
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Ödenecek Tutar:', 350, paymentY + 50, { width: 100, align: 'right' })
          .text(`${document.grandTotal.toFixed(2)} ${document.currency}`, 450, paymentY + 50, { width: 100, align: 'right' });
      }
    }
    
    // Notlar ve şartlar
    let notesY = isProposal ? summaryY + 120 : summaryY + 180;
    
    if (document.notes || document.terms) {
      // Sayfanın alt kısmında yer kalmadıysa yeni sayfa ekle
      if (notesY > 700) {
        doc.addPage();
        notesY = 50;
      }
      
      if (document.notes) {
        doc
          .fontSize(13)
          .font('Helvetica-Bold')
          .text('Notlar:', 50, notesY);
        
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(document.notes, 50, notesY + 20, { width: 500 });
        
        notesY += 20 + doc.heightOfString(document.notes, { width: 500 });
      }
      
      if (document.terms) {
        notesY += 20;
        
        doc
          .fontSize(13)
          .font('Helvetica-Bold')
          .text('Şartlar ve Koşullar:', 50, notesY);
        
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(document.terms, 50, notesY + 20, { width: 500 });
      }
    }
    
    // PDF'i sonlandır
    doc.end();
    
    // Stream'in tamamlanmasını bekle
    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve(filePath);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    throw new Error(`PDF oluşturulurken hata: ${error.message}`);
  }
};

module.exports = {
  generatePDF
}; 
