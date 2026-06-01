export function toMonthKey(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const match = dateStr.match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : '';
}

export function formatMonthLabel(monthKey) {
  if (!monthKey) return 'Unknown';
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export function compareMonthKeys(a, b, direction = 'desc') {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const cmp = a.localeCompare(b);
  return direction === 'asc' ? cmp : -cmp;
}

export function getMonthOptionsFromBookings(bookings, dateGetter) {
  const keys = new Set();

  for (const booking of bookings) {
    const key = toMonthKey(dateGetter(booking));
    if (key) keys.add(key);
  }

  return Array.from(keys).sort((a, b) => b.localeCompare(a));
}

export function getPeriodRange(preset, customStart = '', customEnd = '') {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const y = today.getFullYear();
  const m = today.getMonth();

  if (preset === 'this_month') {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    return { start, end };
  }

  if (preset === 'last_month') {
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    return { start, end };
  }

  if (preset === 'last_3_months') {
    const start = new Date(y, m - 2, 1);
    const end = new Date(y, m + 1, 0);
    return { start, end };
  }

  if (preset === 'ytd') {
    const start = new Date(y, 0, 1);
    const end = new Date(y, m + 1, 0);
    return { start, end };
  }

  if (preset === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }

  return null;
}

export function isDateInRange(dateStr, range) {
  if (!range || !dateStr) return false;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  date.setHours(12, 0, 0, 0);
  return date >= range.start && date <= range.end;
}

export function isMonthKeyInPeriod(monthKey, preset, customStart, customEnd) {
  if (preset === 'all_time' || !monthKey) {
    return preset === 'all_time';
  }

  const range = getPeriodRange(preset, customStart, customEnd);
  if (!range) return true;

  const [year, month] = monthKey.split('-').map(Number);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  monthEnd.setHours(23, 59, 59, 999);

  return monthEnd >= range.start && monthStart <= range.end;
}

export function groupByMonthKey(items, dateGetter) {
  const groups = new Map();

  for (const item of items) {
    const key = toMonthKey(dateGetter(item)) || 'unknown';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(item);
  }

  return Array.from(groups.entries()).sort(([a], [b]) =>
    compareMonthKeys(a, b, 'desc')
  );
}
