import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';

import PageHeader from '../components/ui/PageHeader';
import {
  SecondaryButton,
  OutlineButton,
} from '../components/common/BrandButton';
import BookingTableHead from '../components/bookings/BookingTableHead';
import BookingTableRow from '../components/bookings/BookingTableRow';
import BookingTableToolbar from '../components/bookings/BookingTableToolbar';
import { prepareBookingsForList } from '../utils/bookingFilters';
import { getBookingProfit } from '../utils/bookingFinancials';
import { resolveBookingStatus } from '../utils/bookingStatus';
import { applySort, getComparator } from '../utils/tableSort';
import { useTable, emptyRows } from '../hooks/useTable';

export default function BookingsPage({
  bookings,
  searchTerm,
  statusFilter,
  monthFilter,
  onSearchChange,
  onStatusChange,
  onMonthChange,
  onView,
  onEdit,
  onDelete,
  canEdit,
  onNewBooking,
  onExportCsv,
  onShowReminders,
}) {
  const table = useTable({
    defaultOrderBy: 'travelStartDate',
    defaultOrder: 'desc',
    defaultRowsPerPage: 10,
  });

  const filtered = useMemo(
    () =>
      prepareBookingsForList(bookings, {
        searchTerm,
        statusFilter,
        monthFilter,
        sortKey: 'departure_desc',
      }),
    [bookings, searchTerm, statusFilter, monthFilter]
  );

  const enriched = useMemo(
    () =>
      filtered.map((booking) => ({
        ...booking,
        _status: resolveBookingStatus(booking),
        _profit: getBookingProfit(booking),
      })),
    [filtered]
  );

  const sorted = useMemo(
    () =>
      applySort(enriched, getComparator(table.order, table.orderBy)),
    [enriched, table.order, table.orderBy]
  );

  const paginated = sorted.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  if (!bookings.length) {
    return (
      <Box>
        <PageHeader
          title="Bookings"
          subtitle="Manage tour reservations"
          action={
            canEdit && (
              <SecondaryButton onClick={onNewBooking}>+ New Booking</SecondaryButton>
            )
          }
        />
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No bookings added yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first booking to start tracking records.
          </Typography>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Bookings"
        subtitle={`${bookings.length} total · ${filtered.length} shown`}
        action={
          <>
            <OutlineButton onClick={onShowReminders}>Departure reminders</OutlineButton>
            <OutlineButton onClick={onExportCsv}>Export CSV</OutlineButton>
            {canEdit && (
              <SecondaryButton onClick={onNewBooking}>+ New Booking</SecondaryButton>
            )}
          </>
        }
      />

      <Card>
        <BookingTableToolbar
          bookings={bookings}
          searchValue={searchTerm}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          monthFilter={monthFilter}
          onMonthChange={onMonthChange}
        />

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size={table.dense ? 'small' : 'medium'}>
            <TableHead>
              <BookingTableHead
                order={table.order}
                orderBy={table.orderBy}
                onSort={table.onSort}
                rowCount={sorted.length}
                numSelected={table.selected.length}
                onSelectAll={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    paginated.map((row) => row.id)
                  )
                }
              />
            </TableHead>
            <TableBody>
              {paginated.map((row) => (
                <BookingTableRow
                  key={row.id}
                  row={row}
                  selected={table.selected.includes(row.id)}
                  onSelectRow={table.onSelectRow}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  canEdit={canEdit}
                />
              ))}
              {emptyRows(table.page, table.rowsPerPage, sorted.length) > 0 && (
                <tr style={{ height: 53 * emptyRows(table.page, table.rowsPerPage, sorted.length) }} />
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filtered.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No matching bookings. Try a different search or filter.
            </Typography>
          </Box>
        )}

        <TablePagination
          component="div"
          count={sorted.length}
          page={table.page}
          onPageChange={table.onChangePage}
          rowsPerPage={table.rowsPerPage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>
    </Box>
  );
}
