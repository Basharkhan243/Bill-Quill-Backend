import PDFDocument from 'pdfkit';
import fs from 'fs';

const generateInvoicePDF = async (invoice, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Header
      doc.fontSize(20).text('TAX INVOICE', { align: 'center' });
      doc.moveDown();
      
      // Company info
      doc.fontSize(12)
        .text(user.businessName || 'BTC Bazaar', { align: 'center' })
        .text(user.address || 'No. 35/1. B.T.S Road, Near Mico Back Gate, Bangalore - 560 030.', { align: 'center' })
        .text(`GSTIN: ${user.gstin || '29AARFB3550B1ZJ'}`, { align: 'center' })
        .text(`Phone: ${user.phone || '22239132'}`, { align: 'center' });
      
      doc.moveDown();
      
      // Invoice details
      doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
      doc.text(`Date: ${invoice.date.toLocaleDateString()}`);
      doc.moveDown();
      
      // Customer details
      doc.text(`Customer: ${invoice.customer.name}`);
      doc.text(`Customer ID: ${invoice.customer.customerId}`);
      if (invoice.customer.gstin) {
        doc.text(`GSTIN: ${invoice.customer.gstin}`);
      }
      if (invoice.customer.address) {
        doc.text(`Address: ${invoice.customer.address}`);
      }
      if (invoice.customer.phone) {
        doc.text(`Phone: ${invoice.customer.phone}`);
      }
      
      doc.moveDown();
      
      // Table header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold')
        .text('Description', 50, tableTop)
        .text('Qty', 250, tableTop)
        .text('Rate', 300, tableTop)
        .text('GST %', 350, tableTop)
        .text('Amount', 400, tableTop);
      
      doc.moveDown();
      doc.font('Helvetica');
      
      // Table rows
      let tableBottom = doc.y;
      invoice.items.forEach((item, index) => {
        const y = tableBottom + (index * 20);
        doc.text(item.description, 50, y)
          .text(item.quantity.toString(), 250, y)
          .text(`₹${item.rate.toFixed(2)}`, 300, y)
          .text(`${item.gstPercentage}%`, 350, y)
          .text(`₹${item.amount.toFixed(2)}`, 400, y);
      });
      
      tableBottom = doc.y + (invoice.items.length * 20) + 20;
      
      // Totals
      doc.moveTo(50, tableBottom).lineTo(550, tableBottom).stroke();
      doc.font('Helvetica-Bold')
        .text('Subtotal:', 350, tableBottom + 20)
        .text(`₹${invoice.subtotal.toFixed(2)}`, 400, tableBottom + 20)
        .text('Total GST:', 350, tableBottom + 40)
        .text(`₹${invoice.totalGst.toFixed(2)}`, 400, tableBottom + 40)
        .text('Total Amount:', 350, tableBottom + 60)
        .text(`₹${invoice.totalAmount.toFixed(2)}`, 400, tableBottom + 60);
      
      // Footer
      doc.moveDown(4);
      doc.font('Helvetica')
        .fontSize(10)
        .text('Goods once sold cannot be taken back or exchanged under any circumstances', { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export { generateInvoicePDF };