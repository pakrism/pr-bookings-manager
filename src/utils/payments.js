export function createPaymentId() {
  return `pay_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizePaymentType(type) {
  return type === 'debit' ? 'debit' : 'credit';
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
        type: 'credit',
      },
    ];
  }

  return [];
}

export function getLedgerEntries(bookingOrPayments) {
  const payments = Array.isArray(bookingOrPayments)
    ? bookingOrPayments
    : getPaymentsFromBooking(bookingOrPayments);

  return payments.map((payment) => ({
    ...payment,
    type: normalizePaymentType(payment.type),
    amount: Number(payment.amount || 0),
  }));
}

export function getTotalCredits(bookingOrPayments) {
  return getLedgerEntries(bookingOrPayments)
    .filter((entry) => entry.type === 'credit')
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

export function getTotalDebits(bookingOrPayments) {
  return getLedgerEntries(bookingOrPayments)
    .filter((entry) => entry.type === 'debit')
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

export function getTotalPaid(bookingOrPayments) {
  return getTotalCredits(bookingOrPayments);
}

export function getNetCashPosition(bookingOrPayments) {
  return getTotalCredits(bookingOrPayments) - getTotalDebits(bookingOrPayments);
}

export function computeFinancialsFromLedger(packagePrice, entries, status) {
  const normalized = (entries || []).map((entry) => ({
    ...entry,
    type: normalizePaymentType(entry.type),
    amount: Number(entry.amount || 0),
  }));

  const totalPaid = normalized
    .filter((entry) => entry.type === 'credit')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalExpenses = normalized
    .filter((entry) => entry.type === 'debit')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const price = Number(packagePrice || 0);
  const totalProfit = normalized.some((entry) => entry.amount > 0)
    ? price - totalExpenses
    : null;
  const balanceDue = computeRemainingAmount(price, totalPaid, status);
  const netCash = totalPaid - totalExpenses;

  return {
    totalPaid,
    totalExpenses,
    totalProfit,
    balanceDue,
    netCash,
  };
}

export function computeRemainingAmount(packagePrice, totalPaid, status) {
  if (status === 'Completed') {
    return 0;
  }

  return Math.max(Number(packagePrice || 0) - Number(totalPaid || 0), 0);
}

export function emptyLedgerRow(type = 'credit') {
  return {
    id: createPaymentId(),
    type: normalizePaymentType(type),
    amount: '',
    paidAt: new Date().toISOString().slice(0, 10),
    note: '',
  };
}

export function emptyPaymentRow() {
  return emptyLedgerRow('credit');
}

export function normalizeFormPayments(payments) {
  return (payments || [])
    .filter((payment) => Number(payment.amount || 0) > 0)
    .map((payment) => ({
      id: payment.id || createPaymentId(),
      type: normalizePaymentType(payment.type),
      amount: Number(payment.amount || 0),
      paidAt: payment.paidAt || new Date().toISOString().slice(0, 10),
      note: (payment.note || '').trim(),
    }));
}

export function getLedgerWithRunningCash(entries) {
  const sorted = [...(entries || [])]
    .filter((entry) => Number(entry.amount || 0) > 0)
    .sort((a, b) => {
      const dateCompare = String(a.paidAt || '').localeCompare(String(b.paidAt || ''));
      if (dateCompare !== 0) return dateCompare;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });

  let runningCash = 0;
  return sorted.map((entry) => {
    const amount = Number(entry.amount || 0);
    const type = normalizePaymentType(entry.type);
    runningCash += type === 'credit' ? amount : -amount;
    return {
      ...entry,
      type,
      amount,
      runningCash,
    };
  });
}
