export const MANUAL_BOOKING_STATUSES = ['Cancelled', 'Refunded'];

export const AUTO_BOOKING_STATUSES = ['Upcoming', 'On-Going', 'Completed'];

function toDateOnlyString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeBookingStatus(
  travelStartDate,
  travelEndDate,
  referenceDate = new Date()
) {
  const today = toDateOnlyString(referenceDate);

  if (!travelStartDate) {
    return 'Upcoming';
  }

  if (today < travelStartDate) {
    return 'Upcoming';
  }

  if (travelEndDate && today > travelEndDate) {
    return 'Completed';
  }

  return 'On-Going';
}

export function resolveBookingStatus(booking, referenceDate = new Date()) {
  if (MANUAL_BOOKING_STATUSES.includes(booking.bookingStatus)) {
    return booking.bookingStatus;
  }

  return computeBookingStatus(
    booking.travelStartDate,
    booking.travelEndDate,
    referenceDate
  );
}

export function resolveFormBookingStatus(form, referenceDate = new Date()) {
  if (form.statusOverride) {
    return form.statusOverride;
  }

  return computeBookingStatus(
    form.travelStartDate,
    form.travelEndDate,
    referenceDate
  );
}
