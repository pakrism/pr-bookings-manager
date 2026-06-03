export const PERIOD_PRESETS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'custom', label: 'Custom range' },
  { value: 'all_time', label: 'All time' },
];

export const REVENUE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'zohaib', label: 'Zohaib' },
  { id: 'pervaiz', label: 'Pervaiz' },
];

export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '-';
  return `${value.toFixed(1)}%`;
}
