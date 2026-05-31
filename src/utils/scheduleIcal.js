function formatIcalDate(dateStr) {
  if (!dateStr) return null;
  const value = dateStr.replace(/-/g, '');
  return value.length === 8 ? value : null;
}

function escapeIcalText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function downloadScheduleIcal(batches, filename = 'pakrism-upcoming.ics') {
  const events = batches
    .map((batch) => {
      const start = formatIcalDate(batch.travelStartDate);
      const end = formatIcalDate(batch.travelEndDate);
      if (!start || !end) return null;

      const uid = `pakrism-${batch.batchKey}@pakrism.pk`;
      const summary = escapeIcalText(
        `${batch.destination} — ${batch.tripBatch}`
      );
      const description = escapeIcalText(
        `${batch.totalBookings} bookings, ${batch.totalPax} pax`
      );

      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatIcalDate(new Date().toISOString().slice(0, 10))}T000000Z`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
      ].join('\r\n');
    })
    .filter(Boolean);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pakrism//Bookings Manager//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
