import { getPeriodRange, isDateInRange, isMonthKeyInPeriod, toMonthKey } from './datePeriods';

const ZOHAIB_SHARE_KEY = 'zohaib:zohaib';
const FAWAD_SHARE_KEY = 'zohaib:fawad';
const SOHAIB_SHARE_KEY = 'zohaib:sohaib';

export function filterPoolExpensesByPeriod(expenses, preset, customStart = '', customEnd = '') {
  if (!Array.isArray(expenses)) return [];

  if (preset === 'all_time') {
    return expenses.filter((expense) => expense.poolId === 'zohaib');
  }

  const range = getPeriodRange(preset, customStart, customEnd);
  if (range) {
    return expenses.filter(
      (expense) =>
        expense.poolId === 'zohaib' && isDateInRange(expense.expenseDate, range)
    );
  }

  return expenses.filter((expense) => {
    if (expense.poolId !== 'zohaib') return false;
    const monthKey = toMonthKey(expense.expenseDate);
    return isMonthKeyInPeriod(monthKey, preset, customStart, customEnd);
  });
}

export function sumPoolExpenses(expenses) {
  return (expenses || []).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

export function computeZohaibPoolNetShares(recipientTotals, totalExpenses) {
  const poolGross =
    (recipientTotals?.[ZOHAIB_SHARE_KEY]?.total ?? 0) +
    (recipientTotals?.[FAWAD_SHARE_KEY]?.total ?? 0) +
    (recipientTotals?.[SOHAIB_SHARE_KEY]?.total ?? 0);

  const zohaibGross = recipientTotals?.[ZOHAIB_SHARE_KEY]?.total ?? 0;
  const fawadGross = recipientTotals?.[FAWAD_SHARE_KEY]?.total ?? 0;
  const sohaibGross = recipientTotals?.[SOHAIB_SHARE_KEY]?.total ?? 0;
  const zfGross = zohaibGross + fawadGross;

  const safeExpenses = Math.max(0, Math.round(Number(totalExpenses || 0)));
  const zExpenseShare = Math.floor(safeExpenses / 2);
  const fExpenseShare = safeExpenses - zExpenseShare;

  const zohaibNet = Math.round(zohaibGross) - zExpenseShare;
  const fawadNet = Math.round(fawadGross) - fExpenseShare;
  const sohaibNet = Math.round(sohaibGross);

  return {
    poolGross: Math.round(poolGross),
    totalExpenses: safeExpenses,
    poolNet: Math.round(poolGross) - safeExpenses,
    zfGross: Math.round(zfGross),
    zfNet: Math.round(zfGross) - safeExpenses,
    sohaib: { gross: sohaibNet, net: sohaibNet, expenseShare: 0 },
    zohaib: { gross: Math.round(zohaibGross), net: zohaibNet, expenseShare: zExpenseShare },
    fawad: { gross: Math.round(fawadGross), net: fawadNet, expenseShare: fExpenseShare },
  };
}
