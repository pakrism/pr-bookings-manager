import { resolveBookingStatus } from './bookingStatus';
import { getTotalPaid } from './payments';

export function getBookingBalance(booking) {
  if (resolveBookingStatus(booking) === 'Completed') {
    return 0;
  }

  const packagePrice = Number(booking.packagePrice || 0);
  const totalPaid = getTotalPaid(booking);
  const stored = Number(booking.remainingAmount);

  if (!Number.isNaN(stored) && booking.remainingAmount != null) {
    const computed = Math.max(packagePrice - totalPaid, 0);
    if (Math.abs(stored - computed) < 1) {
      return stored;
    }
  }

  return Math.max(packagePrice - totalPaid, 0);
}
