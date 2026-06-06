import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';

const HEAD_CELLS = [
  { id: 'bookingRef', label: 'Ref', width: 90 },
  { id: 'guestName', label: 'Guest' },
  { id: 'packageName', label: 'Package' },
  { id: 'travelStartDate', label: 'Travel' },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'packagePrice', label: 'Price', align: 'right', width: 110 },
  { id: 'profit', label: 'Profit', align: 'right', width: 120 },
  { id: 'actions', label: '', width: 56, sortable: false },
];

export default function BookingTableHead({ order, orderBy, onSort }) {
  return (
    <TableRow>
      {HEAD_CELLS.map((head) => (
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
