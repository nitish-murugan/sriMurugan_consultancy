import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure invoices directory exists
const invoicesDir = path.join(__dirname, '../uploads/invoices');
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

export const generateInvoice = async (booking, user) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `invoice-${booking.bookingId}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);

      // Colors
      const primaryColor = '#667eea';
      const textColor = '#333333';
      const lightGray = '#f5f5f5';

      // Header
      doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);
      
      doc.fillColor('white')
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('Sri Murugan Tours', 50, 40);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('Industrial Visit Tour Booking', 50, 75);

      // Invoice Title
      doc.fillColor(textColor)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('INVOICE', 50, 150);

      // Invoice Details Box
      doc.rect(400, 140, 160, 80).fill(lightGray);
      doc.fillColor(textColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Invoice No:', 410, 150)
         .font('Helvetica')
         .text(booking.bookingId, 410, 165)
         .font('Helvetica-Bold')
         .text('Date:', 410, 185)
         .font('Helvetica')
         .text(new Date().toLocaleDateString('en-IN'), 410, 200);

      // Customer Details
      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Bill To:', 50, 250);

      doc.fillColor(textColor)
         .fontSize(10)
         .font('Helvetica')
         .text(user.name, 50, 270)
         .text(user.email, 50, 285)
         .text(user.phone, 50, 300)
         .text(user.organization || '', 50, 315);

      // Trip Details Section
      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Trip Details', 50, 360);

      const tripY = 385;
      doc.fillColor(textColor).fontSize(10).font('Helvetica');
      
      const tripDetails = [
        ['From', booking.tripDetails.departureCity],
        ['To', booking.tripDetails.destination],
        ['Start Date', new Date(booking.tripDetails.startDate).toLocaleDateString('en-IN')],
        ['End Date', new Date(booking.tripDetails.endDate).toLocaleDateString('en-IN')],
        ['Duration', `${booking.tripDetails.duration} days`]
      ];

      tripDetails.forEach((item, idx) => {
        doc.font('Helvetica-Bold').text(item[0] + ':', 50, tripY + (idx * 18));
        doc.font('Helvetica').text(item[1], 150, tripY + (idx * 18));
      });

      // Group Details
      doc.fillColor(primaryColor)
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Group Details', 300, 360);

      const groupY = 385;
      const groupDetails = [
        ['Boys', booking.groupDetails.boys],
        ['Girls', booking.groupDetails.girls],
        ['Staff', booking.groupDetails.staff],
        ['Total', booking.groupDetails.total]
      ];

      doc.fillColor(textColor).fontSize(10);
      groupDetails.forEach((item, idx) => {
        doc.font('Helvetica-Bold').text(item[0] + ':', 300, groupY + (idx * 18));
        doc.font('Helvetica').text(String(item[1]), 400, groupY + (idx * 18));
      });

      // Services Table
      const tableTop = 500;
      
      // Table Header
      doc.rect(50, tableTop, 510, 25).fill(primaryColor);
      doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
      doc.text('Service', 60, tableTop + 8);
      doc.text('Details', 250, tableTop + 8);
      doc.text('Amount', 480, tableTop + 8);

      // Table Rows
      doc.fillColor(textColor).font('Helvetica');
      let currentY = tableTop + 30;

      const services = [
        { service: 'Transportation', details: booking.transport.busType, amount: '-' },
        { service: 'Accommodation', details: booking.accommodation.type, amount: '-' },
        { service: 'Guide Service', details: booking.accommodation.guideRequired ? 'Yes' : 'No', amount: '-' },
        { service: 'Food Arrangement', details: booking.foodArrangement.required ? 'Yes' : 'No', amount: '-' }
      ];

      services.forEach((item, idx) => {
        if (idx % 2 === 0) {
          doc.rect(50, currentY - 5, 510, 22).fill('#fafafa');
        }
        doc.fillColor(textColor);
        doc.text(item.service, 60, currentY);
        doc.text(item.details, 250, currentY);
        doc.text(item.amount, 480, currentY);
        currentY += 22;
      });

      // Total
      doc.rect(350, currentY + 10, 210, 40).fill(primaryColor);
      doc.fillColor('white')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('Total Amount:', 360, currentY + 22)
         .text(`₹${booking.payment.amount.toLocaleString('en-IN')}`, 480, currentY + 22);

      // Payment Status
      const paymentStatus = booking.payment.status === 'completed' ? 'PAID' : 'PENDING';
      const statusColor = booking.payment.status === 'completed' ? '#28a745' : '#dc3545';
      
      doc.rect(50, currentY + 70, 80, 25).fill(statusColor);
      doc.fillColor('white')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(paymentStatus, 65, currentY + 78);

      if (booking.payment.razorpayPaymentId) {
        doc.fillColor(textColor)
           .fontSize(9)
           .font('Helvetica')
           .text(`Payment ID: ${booking.payment.razorpayPaymentId}`, 140, currentY + 78);
      }

      // Driver Details (if booking is accepted)
      if (booking.driverDetails && booking.status === 'accepted') {
        doc.fillColor(primaryColor)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Driver Details', 300, currentY + 70);

        const driverY = currentY + 90;
        doc.fillColor(textColor).fontSize(10).font('Helvetica');
        doc.text(`Name: ${booking.driverDetails.name}`, 300, driverY);
        doc.text(`Phone: ${booking.driverDetails.phone}`, 300, driverY + 15);
        doc.text(`License: ${booking.driverDetails.licenseNumber}`, 300, driverY + 30);
      }

      // Footer
      doc.fillColor('#666666')
         .fontSize(9)
         .font('Helvetica')
         .text('Thank you for choosing Sri Murugan Tours!', 50, 750, { align: 'center' })
         .text('For queries, contact: support@srimurugantours.com', 50, 765, { align: 'center' });

      // Terms
      doc.fontSize(8)
         .fillColor('#999999')
         .text('This is a computer-generated invoice and does not require a signature.', 50, 785, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve({
          success: true,
          filePath: `/uploads/invoices/${fileName}`,
          fileName
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};
