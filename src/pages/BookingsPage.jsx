import { useEffect, useMemo, useRef, useState } from 'react';
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
    bookingListPage,
    setBookingListPage,
    bookingListRowsPerPage,
    setBookingListRowsPerPage,
    bookingListOrderBy,
    setBookingListOrderBy,
    bookingListOrder,
    setBookingListOrder,
    bookingListDense,
    setBookingListDense,
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

  const [selected, setSelected] = useState([]);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

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

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        bookingSearch,
        bookingStatusTab,
        bookingDatePreset,
        bookingTravelMonth,
        bookingCustomStart,
        bookingCustomEnd,
        bookingBookedByFilter,
      }),
    [
      bookingSearch,
      bookingStatusTab,
      bookingDatePreset,
      bookingTravelMonth,
      bookingCustomStart,
      bookingCustomEnd,
      bookingBookedByFilter,
    ]
  );
  const prevFilterKey = useRef(filterKey);

  useEffect(() => {
    if (prevFilterKey.current !== filterKey) {
      setBookingListPage(0);
      prevFilterKey.current = filterKey;
    }
  }, [filterKey, setBookingListPage]);

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
    () => applySort(enriched, getComparator(bookingListOrder, bookingListOrderBy)),
    [enriched, bookingListOrder, bookingListOrderBy]
  );

  const paginated = sorted.slice(
    bookingListPage * bookingListRowsPerPage,
    bookingListPage * bookingListRowsPerPage + bookingListRowsPerPage
  );

  const selectedBookings = useMemo(
    () => sorted.filter((booking) => selected.includes(booking.id)),
    [sorted, selected]
  );

  const selectionMetrics = useMemo(
    () => computeSelectionMetrics(selectedBookings),
    [selectedBookings]
  );

  function handleSort(id) {
    const isAsc = bookingListOrderBy === id && bookingListOrder === 'asc';
    setBookingListOrder(isAsc ? 'desc' : 'asc');
    setBookingListOrderBy(id);
  }

  function handleSelectRow(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  }

  function handleSelectAll(checked) {
    setSelected(checked ? sorted.map((row) => row.id) : []);
  }

  function handleChangePage(_event, newPage) {
    setBookingListPage(newPage);
  }

  function handleChangeRowsPerPage(event) {
    setBookingListRowsPerPage(parseInt(event.target.value, 10));
    setBookingListPage(0);
  }

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
          setSelected([]);
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

        {showSelection && selected.length > 0 && (
          <BookingSelectionBar
            metrics={selectionMetrics}
            canEdit={capabilities.canBulkEditBookings}
            onClear={() => setSelected([])}
            onBulkEdit={() => setBulkEditOpen(true)}
            onExportSelected={handleExportSelected}
            onDeleteSelected={handleDeleteSelected}
          />
        )}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size={bookingListDense ? 'small' : 'medium'}>
            <TableHead>
              <BookingTableHead
                order={bookingListOrder}
                orderBy={bookingListOrderBy}
                onSort={handleSort}
                rowCount={sorted.length}
                numSelected={selectedBookings.length}
                showFinancialColumns={showFinancialColumns}
                showSelection={showSelection}
                onSelectAll={handleSelectAll}
              />
            </TableHead>
            <TableBody>
              {paginated.map((row) => (
                <BookingTableRow
                  key={row.id}
                  row={row}
                  selected={selected.includes(row.id)}
                  onSelectRow={handleSelectRow}
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
            control={
              <Switch
                checked={bookingListDense}
                onChange={(e) => setBookingListDense(e.target.checked)}
                size="small"
              />
            }
            label="Dense"
          />
          <TablePagination
            component="div"
            count={sorted.length}
            page={bookingListPage}
            onPageChange={handleChangePage}
            rowsPerPage={bookingListRowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100, 500]}
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
          onComplete={() => setSelected([])}
        />
      )}
    </Box>
  );
}
