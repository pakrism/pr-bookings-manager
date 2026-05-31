export function createPaymentId() {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getPaymentsFromBooking(booking) {
  if (Array.isArray(booking?.payments) && booking.payments.length > 0) {
    return booking.payments;
  }

  const advance = Number(booking?.advanceReceived || 0);
  if (advance > 0) {
    return [
      {
        id: 'legacy',
        amount: advance,
        paidAt:
          booking?.travelStartDate ||
          new Date().toISOString().slice(0, 10),
        note: 'Legacy advance',
      },
    ];
  }

  return [];
}

export function getTotalPaid(bookingOrPayments) {
  const payments = Array.isArray(bookingOrPayments)
    ? bookingOrPayments
    : getPaymentsFromBooking(bookingOrPayments);

  return payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

export function computeRemainingAmount(packagePrice, totalPaid, status) {
  if (status === 'Completed') {
    return 0;
  }

  return Math.max(Number(packagePrice || 0) - Number(totalPaid || 0), 0);
}

export function emptyPaymentRow() {
  return {
    id: createPaymentId(),
    amount: '',
    paidAt: new Date().toISOString().slice(0, 10),
    note: '',
  };
}

export function normalizeFormPayments(payments) {
  return (payments || [])
    .filter((payment) => Number(payment.amount || 0) > 0)
    .map((payment) => ({
      id: payment.id || createPaymentId(),
      amount: Number(payment.amount || 0),
      paidAt: payment.paidAt || new Date().toISOString().slice(0, 10),
      note: (payment.note || '').trim(),
    }));
}
