function descendingComparator(a, b, orderBy) {
  const aVal = getCellValue(a, orderBy);
  const bVal = getCellValue(b, orderBy);

  if (bVal == null && aVal == null) return 0;
  if (bVal == null) return -1;
  if (aVal == null) return 1;

  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return bVal.localeCompare(aVal);
  }

  if (bVal < aVal) return -1;
  if (bVal > aVal) return 1;
  return 0;
}

function getCellValue(row, orderBy) {
  switch (orderBy) {
    case 'guestName':
      return row.guestName || '';
    case 'packageName':
      return row.packageName || '';
    case 'travelStartDate':
      return row.travelStartDate || '';
    case 'bookedBy':
      return row.bookedBy || '';
    case 'packagePrice':
      return Number(row.packagePrice || 0);
    case 'profit': {
      const profit = row._profit;
      return profit != null ? Number(profit) : null;
    }
    case 'status':
      return row._status || '';
    case 'bookingRef':
      return row.bookingRef || '';
    default:
      return row[orderBy] ?? '';
  }
}

export function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function applySort(array, comparator) {
  const stabilized = array.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilized.map((el) => el[0]);
}
