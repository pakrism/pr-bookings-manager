const FINANCIAL_FIELDS = ['packagePrice', 'totalExpenses', 'totalProfit'];

export function syncFinancials(form, changedField, rawValue) {
  if (!FINANCIAL_FIELDS.includes(changedField)) {
    return { ...form, [changedField]: rawValue };
  }

  const price = Number(form.packagePrice || 0);
  const next = { ...form, [changedField]: rawValue };

  if (changedField === 'totalExpenses') {
    next.totalProfit = String(price - Number(rawValue || 0));
  } else if (changedField === 'totalProfit') {
    next.totalExpenses = String(price - Number(rawValue || 0));
  } else if (changedField === 'packagePrice') {
    const hasExpenses =
      form.totalExpenses !== '' && form.totalExpenses != null;
    const hasProfit = form.totalProfit !== '' && form.totalProfit != null;

    if (hasExpenses) {
      next.totalProfit = String(price - Number(form.totalExpenses || 0));
    } else if (hasProfit) {
      next.totalExpenses = String(price - Number(form.totalProfit || 0));
    }
  }

  return next;
}

export function getBookingProfit(booking) {
  if (booking.totalProfit != null && booking.totalProfit !== '') {
    return Number(booking.totalProfit);
  }

  if (booking.totalExpenses != null && booking.totalExpenses !== '') {
    return (
      Number(booking.packagePrice || 0) - Number(booking.totalExpenses || 0)
    );
  }

  return null;
}

export function hasBookingFinancials(booking) {
  return booking.totalExpenses != null || booking.totalProfit != null;
}
