import { resolveBookingStatus } from './bookingStatus';
import { computeRemainingAmount, getTotalPaid } from './payments';

export function getBookingSyncPatch(booking) {
  const status = resolveBookingStatus(booking);
  const totalPaid = getTotalPaid(booking);
  const remainingAmount = computeRemainingAmount(
    booking.packagePrice,
    totalPaid,
    status
  );

  const storedStatus = booking.bookingStatus;
  const storedRemaining = Number(booking.remainingAmount ?? NaN);

  if (
    storedStatus === status &&
    !Number.isNaN(storedRemaining) &&
    storedRemaining === remainingAmount
  ) {
    return null;
  }

  return { bookingStatus: status, remainingAmount };
}
