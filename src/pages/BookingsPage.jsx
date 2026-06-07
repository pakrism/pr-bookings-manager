import { useMemo, useState } from 'react';
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
import BookingSelectionBar from '../components/bookings/BookingSelectionBar';
import BookingBulkEditDialog from '../components/bookings/BookingBulkEditDialog';
import {
  prepareBookingsForList,
  filterBookingsByTravelPreset,
  filterBookingsByBookedBy,
} from '../utils/bookingFilters';
import { computeSelectionMetrics } from '../utils/bookingSelectionMetrics';
import { downloadBookingsCsv } from '../utils/exportBookingsCsv';
import { getBookingProfit } from '../utils/bookingFinancials';
import { resolveBookingStatus } from '../utils/bookingStatus';
import {
  filterBookingsByStatusTab,
  getBookingStatusTabs,
} from '../utils/bookingStatusCounts';
import { applySort, getComparator } from '../utils/tableSort';
import { useTable } from '../hooks/useTable';
import BookingQuickUpdateDialog from '../components/bookings/BookingQuickUpdateDialog';
import { removeBooking } from '../lib/firestore';
import { useAppData } from '../context/AppDataContext';

export default function BookingsPage() {
  const navigate = useNavigate();
  const {
    bookings,
    scopedBookings,
    capabilities,
    bookingSearch,
    setBookingSearch,
    bookingStatusTab,
    setBookingStatusTab,
    bookingDatePreset,
    setBookingDatePreset,
    bookingTravelMonth,
    setBookingTravelMonth,
    bookingCustomStart,
    setBookingCustomStart,
    bookingCustomEnd,
    setBookingCustomEnd,
    bookingBookedByFilter,
    setBookingBookedByFilter,
    handleExportBookingsCsv,
    setShowRemindersModal,
    navigateToBooking,
    navigateToEditBooking,
    requestDeleteBooking,
    setQuickUpdateBooking,
    quickUpdateBooking,
    setConfirmDialog,
    showToast,
  } = useAppData();

  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const table = useTable({
    defaultOrderBy: 'travelStartDate',
    defaultOrder: 'desc',
    defaultRowsPerPage: 10,
  });

  const showFinancialColumns = capabilities.canViewFinancialFields;
  const showSelection = capabilities.canBulkEditBookings || capabilities.canDeleteBookings;

  const statusTabs = useMemo(() => getBookingStatusTabs(scopedBookings), [scopedBookings]);

  const filtered = useMemo(() => {
    let list = filterBookingsByStatusTab(scopedBookings, bookingStatusTab);
    list = prepareBookingsForList(list, {
      searchTerm: bookingSearch,
      statusFilter: 'All Status',
      sortKey: 'departure_desc',
    });
    list = filterBookingsByTravelPreset(list, {
      preset: bookingDatePreset,
      monthKey: bookingTravelMonth,
      customStart: bookingCustomStart,
      customEnd: bookingCustomEnd,
    });
    list = filterBookingsByBookedBy(list, bookingBookedByFilter);
    return list;
  }, [
    scopedBookings,
    bookingStatusTab,
    bookingSearch,
    bookingDatePreset,
    bookingTravelMonth,
    bookingCustomStart,
    bookingCustomEnd,
    bookingBookedByFilter,
  ]);

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

  const selectedBookings = useMemo(
    () => sorted.filter((booking) => table.selected.includes(booking.id)),
    [sorted, table.selected]
  );

  const selectionMetrics = useMemo(
    () => computeSelectionMetrics(selectedBookings),
    [selectedBookings]
  );

  function handleDatePresetChange(value) {
    setBookingDatePreset(value);
    if (value !== 'pick_month') {
      setBookingTravelMonth('');
    }
    if (value !== 'custom') {
      setBookingCustomStart('');
      setBookingCustomEnd('');
    }
  }

  function handleExportSelected() {
    downloadBookingsCsv(selectedBookings, 'pakrism-bookings-selected.csv', {
      includeFinancials: capabilities.canExportFinancials,
    });
    showToast('Selected bookings exported.');
  }

  function handleDeleteSelected() {
    if (!selectedBookings.length) return;

    setConfirmDialog({
      title: 'Delete selected bookings',
      message: `Delete ${selectedBookings.length} booking${selectedBookings.length === 1 ? '' : 's'}? This cannot be undone.`,
      onConfirm: async () => {
        try {
          for (const booking of selectedBookings) {
            await removeBooking(booking.id);
          }
          table.setSelected([]);
          showToast(`${selectedBookings.length} booking${selectedBookings.length === 1 ? '' : 's'} deleted.`);
        } catch (error) {
          showToast('Failed to delete bookings.', 'error');
        }
        setConfirmDialog(null);
      },
    });
  }

  if (!bookings.length) {
    return (
      <Box>
        <CustomBreadcrumbs links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'List' }]} />
        <EmptyContent
          title="No bookings yet"
          description="Create your first booking to start tracking records."
          action={
            capabilities.canWriteBookings && (
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
        subtitle={`${filtered.length} of ${scopedBookings.length} bookings`}
        action={
          <>
            {capabilities.isAdmin && (
              <OutlineButton onClick={() => setShowRemindersModal(true)}>Departure reminders</OutlineButton>
            )}
            {capabilities.canExportFinancials && (
              <OutlineButton onClick={handleExportBookingsCsv}>Export CSV</OutlineButton>
            )}
            {capabilities.canWriteBookings && (
              <SecondaryButton onClick={() => navigate('/bookings/new')}>+ New Booking</SecondaryButton>
            )}
          </>
        }
      />

      <Card sx={{ overflow: 'hidden' }}>
        <TableTabs tabs={statusTabs} value={bookingStatusTab} onChange={setBookingStatusTab} />

        <BookingTableToolbar
          bookings={scopedBookings}
          searchValue={bookingSearch}
          onSearchChange={setBookingSearch}
          datePreset={bookingDatePreset}
          onDatePresetChange={handleDatePresetChange}
          travelMonth={bookingTravelMonth}
          onTravelMonthChange={setBookingTravelMonth}
          customStart={bookingCustomStart}
          customEnd={bookingCustomEnd}
          onCustomStartChange={setBookingCustomStart}
          onCustomEndChange={setBookingCustomEnd}
          bookedByFilter={bookingBookedByFilter}
          onBookedByChange={setBookingBookedByFilter}
          lockBookedByFilter={capabilities.isBookingManager}
        />

        {showSelection && table.selected.length > 0 && (
          <BookingSelectionBar
            metrics={selectionMetrics}
            canEdit={capabilities.canBulkEditBookings}
            onClear={() => table.setSelected([])}
            onBulkEdit={() => setBulkEditOpen(true)}
            onExportSelected={handleExportSelected}
            onDeleteSelected={handleDeleteSelected}
          />
        )}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size={table.dense ? 'small' : 'medium'}>
            <TableHead>
              <BookingTableHead
                order={table.order}
                orderBy={table.orderBy}
                onSort={table.onSort}
                rowCount={sorted.length}
                numSelected={selectedBookings.length}
                showFinancialColumns={showFinancialColumns}
                showSelection={showSelection}
                onSelectAll={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    sorted.map((row) => row.id)
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
                  onView={navigateToBooking}
                  onEdit={navigateToEditBooking}
                  onDelete={capabilities.canDeleteBookings ? requestDeleteBooking : undefined}
                  onQuickUpdate={capabilities.isAdmin ? setQuickUpdateBooking : undefined}
                  canEdit={capabilities.canWriteBookings}
                  showFinancialColumns={showFinancialColumns}
                  showSelection={showSelection}
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

      {bulkEditOpen && (
        <BookingBulkEditDialog
          bookings={selectedBookings}
          open
          onClose={() => setBulkEditOpen(false)}
          onComplete={() => table.setSelected([])}
        />
      )}
    </Box>
  );
}
