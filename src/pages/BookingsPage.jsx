import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import CustomBreadcrumbs from '../components/ui/CustomBreadcrumbs';
import PageHeader from '../components/ui/PageHeader';
import TableTabs from '../components/ui/TableTabs';
import EmptyContent from '../components/ui/EmptyContent';
import { SecondaryButton, OutlineButton } from '../components/common/BrandButton';
import BookingTableHead from '../components/bookings/BookingTableHead';
import BookingTableRow from '../components/bookings/BookingTableRow';
import BookingTableToolbar from '../components/bookings/BookingTableToolbar';
import { prepareBookingsForList, filterBookingsByTravelDateRange, filterBookingsByBookedBy } from '../utils/bookingFilters';
import { getBookingProfit } from '../utils/bookingFinancials';
import { resolveBookingStatus } from '../utils/bookingStatus';
import {
  filterBookingsByStatusTab,
  getBookingStatusTabs,
} from '../utils/bookingStatusCounts';
import { applySort, getComparator } from '../utils/tableSort';
import { useTable, emptyRows } from '../hooks/useTable';
import BookingQuickUpdateDialog from '../components/bookings/BookingQuickUpdateDialog';
import { useAppData } from '../context/AppDataContext';

export default function BookingsPage() {
  const navigate = useNavigate();
  const {
    bookings,
    bookingSearch,
    setBookingSearch,
    bookingStatusTab,
    setBookingStatusTab,
    bookingMonthFilter,
    setBookingMonthFilter,
    bookingDateStart,
    setBookingDateStart,
    bookingDateEnd,
    setBookingDateEnd,
    bookingBookedByFilter,
    setBookingBookedByFilter,
    isAdmin,
    handleExportBookingsCsv,
    setShowRemindersModal,
    navigateToBooking,
    navigateToEditBooking,
    requestDeleteBooking,
    setQuickUpdateBooking,
    quickUpdateBooking,
  } = useAppData();

  const table = useTable({
    defaultOrderBy: 'travelStartDate',
    defaultOrder: 'desc',
    defaultRowsPerPage: 10,
  });

  const statusTabs = useMemo(() => getBookingStatusTabs(bookings), [bookings]);

  const filtered = useMemo(() => {
    let list = filterBookingsByStatusTab(bookings, bookingStatusTab);
    list = prepareBookingsForList(list, {
      searchTerm: bookingSearch,
      statusFilter: 'All Status',
      monthFilter: bookingMonthFilter,
      sortKey: 'departure_desc',
    });
    list = filterBookingsByTravelDateRange(list, bookingDateStart, bookingDateEnd);
    list = filterBookingsByBookedBy(list, bookingBookedByFilter);
    return list;
  }, [bookings, bookingStatusTab, bookingSearch, bookingMonthFilter, bookingDateStart, bookingDateEnd, bookingBookedByFilter]);

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
    () => applySort(enriched, getComparator(table.order, table.orderBy)),
    [enriched, table.order, table.orderBy]
  );

  const paginated = sorted.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  if (!bookings.length) {
    return (
      <Box>
        <CustomBreadcrumbs links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'List' }]} />
        <EmptyContent
          title="No bookings yet"
          description="Create your first booking to start tracking records."
          action={
            isAdmin && (
              <SecondaryButton onClick={() => navigate('/bookings/new')}>
                + New Booking
              </SecondaryButton>
            )
          }
        />
      </Box>
    );
  }

  return (
    <Box>
      <CustomBreadcrumbs links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'Bookings' }, { name: 'List' }]} />
      <PageHeader
        title="List"
        subtitle={`${filtered.length} of ${bookings.length} bookings`}
        action={
          <>
            <OutlineButton onClick={() => setShowRemindersModal(true)}>Departure reminders</OutlineButton>
            <OutlineButton onClick={handleExportBookingsCsv}>Export CSV</OutlineButton>
            {isAdmin && (
              <SecondaryButton onClick={() => navigate('/bookings/new')}>+ New Booking</SecondaryButton>
            )}
          </>
        }
      />

      <Card sx={{ overflow: 'hidden' }}>
        <TableTabs tabs={statusTabs} value={bookingStatusTab} onChange={setBookingStatusTab} />

        <BookingTableToolbar
          bookings={bookings}
          searchValue={bookingSearch}
          onSearchChange={setBookingSearch}
          monthFilter={bookingMonthFilter}
          onMonthChange={setBookingMonthFilter}
          dateStart={bookingDateStart}
          dateEnd={bookingDateEnd}
          onDateStartChange={setBookingDateStart}
          onDateEndChange={setBookingDateEnd}
          bookedByFilter={bookingBookedByFilter}
          onBookedByChange={setBookingBookedByFilter}
        />

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size={table.dense ? 'small' : 'medium'}>
            <TableHead>
              <BookingTableHead
                order={table.order}
                orderBy={table.orderBy}
                onSort={table.onSort}
              />
            </TableHead>
            <TableBody>
              {paginated.map((row) => (
                <BookingTableRow
                  key={row.id}
                  row={row}
                  onView={navigateToBooking}
                  onEdit={navigateToEditBooking}
                  onDelete={requestDeleteBooking}
                  onQuickUpdate={setQuickUpdateBooking}
                  canEdit={isAdmin}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filtered.length === 0 && (
          <EmptyContent title="No matching bookings" description="Try different filters." sx={{ py: 4 }} />
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
          <FormControlLabel
            control={<Switch checked={table.dense} onChange={table.onChangeDense} size="small" />}
            label="Dense"
          />
          <TablePagination
            component="div"
            count={sorted.length}
            page={table.page}
            onPageChange={table.onChangePage}
            rowsPerPage={table.rowsPerPage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </Box>
      </Card>

      {quickUpdateBooking && (
        <BookingQuickUpdateDialog
          booking={quickUpdateBooking}
          open
          onClose={() => setQuickUpdateBooking(null)}
        />
      )}
    </Box>
  );
}
