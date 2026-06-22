export function formatCurrency(value) {
  const number = Number(value || 0);
  return `Rs ${number.toLocaleString()}`;
}

export function formatCurrencyWhole(value) {
  return formatCurrency(Math.round(Number(value || 0)));
}

export function splitLinesToBullets(text = '') {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getNextBookingRef(counterValue) {
  const padded = String(counterValue).padStart(3, '0');
  return `PKR-${padded}`;
}

export function totalPersons(booking) {
  return (
    Number(booking.adults || 0) +
    Number(booking.children || 0) +
    Number(booking.infants || 0)
  );
}

export function getStatusBadgeClass(status) {
  if (status === 'On-Going') return 'status-badge completed';
  if (status === 'Completed') return 'status-badge completed';
  if (status === 'Cancelled') return 'status-badge cancelled';
  if (status === 'Refunded') return 'status-badge refunded';
  return 'status-badge upcoming';
}

export function formatDateForDisplay(dateValue) {
  if (!dateValue) return '-';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function sanitizeWhatsappNumber(number = '') {
  return number.replace(/[^\d]/g, '');
}

export function getWhatsappLink(number = '') {
  const sanitized = sanitizeWhatsappNumber(number);
  if (!sanitized) return '';
  return `https://wa.me/${sanitized}`;
}

export function getPackageImage(imageUrl = '') {
  if (imageUrl && imageUrl.trim()) return imageUrl.trim();
  return 'https://via.placeholder.com/800x420?text=Pakrism+Package';
}
