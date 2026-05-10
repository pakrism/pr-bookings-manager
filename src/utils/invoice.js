import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(booking) {
  const doc = new jsPDF();

  // LOGO
  const logo = 'https://pakrism.pk/wp-content/uploads/2023/05/Logo-PAKRISM.png';
  doc.addImage(logo, 'PNG', 150, 10, 40, 15);

  // HEADER
  doc.setFontSize(14);
  doc.text('Pakrism Travel Platform (Pvt Ltd)', 14, 20);

  doc.setFontSize(10);
  doc.text('support@pakrism.pk', 14, 26);
  doc.text('+92 323 7257476', 14, 31);

  // CLIENT
  doc.text('To:', 14, 45);
  doc.text(booking.guestName, 14, 50);

  // INVOICE INFO
  doc.text(`Invoice: ${booking.bookingRef || '-'}`, 14, 60);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 65);

  // TABLE
  autoTable(doc, {
    startY: 75,
    head: [['Product', 'Qty', 'Price', 'Total']],
    body: [
      [
        booking.packageName,
        booking.adults,
        booking.packagePrice,
        booking.packagePrice,
      ],
    ],
  });

  // SUMMARY
  let finalY = doc.lastAutoTable.finalY + 10;

  doc.text(`Advance: Rs ${booking.advanceReceived}`, 14, finalY);
  doc.text(`Remaining: Rs ${booking.remainingAmount}`, 14, finalY + 6);

  // TERMS
  doc.setFontSize(9);
  doc.text(
    'This serves as a digital receipt. Details are shared via WhatsApp.',
    14,
    finalY + 18
  );

  doc.save(`invoice-${booking.guestName}.pdf`);
}
