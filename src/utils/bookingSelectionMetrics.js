import { getBookingBalance } from './bookingBalance';
import { getBookingProfit } from './bookingFinancials';
import { getTotalPaid } from './payments';

export function computeSelectionMetrics(selectedBookings) {
  let revenue = 0;
  let collected = 0;
  let outstanding = 0;
  let profit = 0;
  let profitCount = 0;

  for (const booking of selectedBookings) {
    revenue += Number(booking.packagePrice || 0);
    collected += getTotalPaid(booking);
    outstanding += getBookingBalance(booking);
    const bookingProfit = getBookingProfit(booking);
    if (bookingProfit != null) {
      profit += bookingProfit;
      profitCount += 1;
    }
  }

  return {
    count: selectedBookings.length,
    revenue,
    collected,
    outstanding,
    profit: profitCount > 0 ? profit : null,
  };
}
