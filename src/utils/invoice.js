import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBookingBalance } from './bookingBalance';
import { getPaymentsFromBooking, getTotalPaid } from './payments';

export function generateInvoicePDF(booking) {
  const doc = new jsPDF();
  const payments = getPaymentsFromBooking(booking);
  const totalPaid = getTotalPaid(booking);
  const balance = getBookingBalance(booking);

  doc.setFontSize(14);
  doc.text('Pakrism Travel Platform (Pvt Ltd)', 14, 20);

  doc.setFontSize(10);
  doc.text('support@pakrism.pk', 14, 26);
  doc.text('+92 323 7257476', 14, 31);

  doc.text('To:', 14, 45);
  doc.text(booking.guestName || '-', 14, 50);

  doc.text(`Invoice: ${booking.bookingRef || '-'}`, 14, 60);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 65);

  autoTable(doc, {
    startY: 75,
    head: [['Product', 'Qty', 'Price', 'Total']],
    body: [
      [
        booking.packageName || '-',
        booking.adults || 1,
        booking.packagePrice || 0,
        booking.packagePrice || 0,
      ],
    ],
  });

  if (payments.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Payment date', 'Note', 'Amount']],
      body: payments.map((payment) => [
        payment.paidAt || '-',
        payment.note || '-',
        payment.amount || 0,
      ]),
    });
  }

  let finalY = doc.lastAutoTable.finalY + 10;

  doc.text(`Total paid: Rs ${totalPaid.toLocaleString()}`, 14, finalY);
  doc.text(`Balance due: Rs ${balance.toLocaleString()}`, 14, finalY + 6);

  doc.setFontSize(9);
  doc.text(
    'This serves as a digital receipt. Details are shared via WhatsApp.',
    14,
    finalY + 18
  );

  doc.save(`invoice-${booking.bookingRef || booking.guestName || 'booking'}.pdf`);
}
