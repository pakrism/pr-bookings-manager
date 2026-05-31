import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBookingBalance } from './bookingBalance';
import { getTotalPaid } from './payments';
import { formatScheduleMoney, getScheduleBatchStatus } from './scheduleHelpers';
import { normalizeBookingTourType } from './tourType';

function renderBatchSection(doc, batch, startY = 14) {
  const batchStatus = getScheduleBatchStatus(batch);

  doc.setFontSize(14);
  doc.text('Pakrism Schedule Batch', 14, startY);

  doc.setFontSize(11);
  doc.text(`Trip Batch: ${batch.tripBatch}`, 14, startY + 10);
  doc.text(`Destination: ${batch.destination}`, 14, startY + 16);
  doc.text(`Duration: ${batch.duration}`, 14, startY + 22);
  doc.text(`Status: ${batchStatus}`, 14, startY + 28);
  doc.text(`Bookings: ${batch.totalBookings}`, 120, startY + 10);
  doc.text(`Pax: ${batch.totalPax}`, 120, startY + 16);
  doc.text(`Advance: ${formatScheduleMoney(batch.totalAdvance)}`, 120, startY + 22);
  doc.text(`Balance: ${formatScheduleMoney(batch.totalBalance)}`, 120, startY + 28);

  autoTable(doc, {
    startY: startY + 36,
    head: [
      [
        'Ref',
        'Guest',
        'Booked By',
        'Type',
        'Pax',
        'Transport',
        'Paid',
        'Package',
        'Balance',
      ],
    ],
    body: batch.bookings.map((booking) => {
      const pax =
        Number(booking.adults || 0) +
        Number(booking.children || 0) +
        Number(booking.infants || 0);

      return [
        booking.bookingRef || '-',
        booking.guestName || '-',
        booking.bookedBy || '-',
        normalizeBookingTourType(booking.type),
        pax,
        booking.transport || '-',
        getTotalPaid(booking),
        booking.packagePrice || 0,
        getBookingBalance(booking),
      ];
    }),
  });

  return doc.lastAutoTable.finalY + 12;
}

export function downloadScheduleBatchPdf(batch) {
  const doc = new jsPDF();
  renderBatchSection(doc, batch);
  doc.save(
    `pakrism-schedule-${batch.destination}-${batch.travelStartDate || 'batch'}.pdf`
  );
}

export function downloadAllScheduleBatchesPdf(batches, title = 'Upcoming Schedules') {
  if (!batches.length) return;

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`Pakrism — ${title}`, 14, 16);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);

  let y = 34;

  batches.forEach((batch, index) => {
    if (index > 0) {
      doc.addPage();
      y = 14;
    }

    y = renderBatchSection(doc, batch, y);

    if (y > 250 && index < batches.length - 1) {
      doc.addPage();
      y = 14;
    }
  });

  const dateLabel = new Date().toISOString().slice(0, 10);
  doc.save(`pakrism-upcoming-schedules-${dateLabel}.pdf`);
}
