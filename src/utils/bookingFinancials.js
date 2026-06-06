import { getTotalDebits } from './payments';

export function syncFinancials(form, changedField, rawValue) {
  if (changedField === 'packagePrice') {
    return { ...form, packagePrice: rawValue };
  }
  return { ...form, [changedField]: rawValue };
}

export function getBookingExpenses(booking) {
  const debitTotal = getTotalDebits(booking);
  if (debitTotal > 0) {
    return debitTotal;
  }

  if (booking.totalExpenses != null && booking.totalExpenses !== '') {
    return Number(booking.totalExpenses || 0);
  }

  return null;
}

export function getBookingProfit(booking) {
  const expenses = getBookingExpenses(booking);
  if (expenses == null) {
    if (booking.totalProfit != null && booking.totalProfit !== '') {
      return Number(booking.totalProfit);
    }
    return null;
  }

  return Number(booking.packagePrice || 0) - expenses;
}

export function hasBookingFinancials(booking) {
  return (
    getTotalDebits(booking) > 0 ||
    booking.totalExpenses != null ||
    booking.totalProfit != null
  );
}
