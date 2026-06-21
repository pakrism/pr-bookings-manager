import { getPeriodRange, isDateInRange, isMonthKeyInPeriod, toMonthKey } from './datePeriods';

const ZOHAIB_SHARE_KEY = 'zohaib:zohaib';
const FAWAD_SHARE_KEY = 'zohaib:fawad';
const SOHAIB_SHARE_KEY = 'zohaib:sohaib';
const ZF_GROSS_RATIO = 0.9;
const ZOHAIB_ZF_RATIO = 55 / 90;
const FAWAD_ZF_RATIO = 35 / 90;

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

  const safeExpenses = Math.max(0, Number(totalExpenses || 0));
  const zExpenseShare = safeExpenses * ZOHAIB_ZF_RATIO;
  const fExpenseShare = safeExpenses * FAWAD_ZF_RATIO;

  const zohaibNet = zohaibGross - zExpenseShare;
  const fawadNet = fawadGross - fExpenseShare;

  return {
    poolGross,
    totalExpenses: safeExpenses,
    poolNet: poolGross - safeExpenses,
    zfGross,
    zfNet: zfGross - safeExpenses,
    sohaib: { gross: sohaibGross, net: sohaibGross, expenseShare: 0 },
    zohaib: { gross: zohaibGross, net: zohaibNet, expenseShare: zExpenseShare },
    fawad: { gross: fawadGross, net: fawadNet, expenseShare: fExpenseShare },
    zfGrossRatio: ZF_GROSS_RATIO,
  };
}
