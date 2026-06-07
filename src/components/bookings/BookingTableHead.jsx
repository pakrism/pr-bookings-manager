import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import Checkbox from '@mui/material/Checkbox';

const HEAD_CELLS = [
  { id: 'bookingRef', label: 'Ref', width: 90 },
  { id: 'guestName', label: 'Guest' },
  { id: 'packageName', label: 'Package' },
  { id: 'travelStartDate', label: 'Travel' },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'packagePrice', label: 'Price', align: 'right', width: 110, financial: true },
  { id: 'profit', label: 'Profit', align: 'right', width: 120, financial: true },
  { id: 'actions', label: '', width: 56, sortable: false },
];

export default function BookingTableHead({
  order,
  orderBy,
  onSort,
  rowCount = 0,
  numSelected = 0,
  onSelectAll,
  showFinancialColumns = true,
  showSelection = true,
}) {
  const cells = HEAD_CELLS.filter((head) => showFinancialColumns || !head.financial);

  return (
    <TableRow>
      {showSelection && (
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={(e) => onSelectAll?.(e.target.checked)}
          />
        </TableCell>
      )}
      {cells.map((head) => (
        <TableCell
          key={head.id}
          align={head.align || 'left'}
          sortDirection={orderBy === head.id ? order : false}
          sx={{ width: head.width, whiteSpace: 'nowrap' }}
        >
          {head.sortable === false ? (
            head.label
          ) : (
            <TableSortLabel
              active={orderBy === head.id}
              direction={orderBy === head.id ? order : 'asc'}
              onClick={() => onSort(head.id)}
            >
              {head.label}
            </TableSortLabel>
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

export { HEAD_CELLS };
