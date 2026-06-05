import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';

import CustomBreadcrumbs from '../components/ui/CustomBreadcrumbs';
import PageHeader from '../components/ui/PageHeader';
import TableTabs from '../components/ui/TableTabs';
import BookingStatusChip from '../components/common/BookingStatusChip';
import { useAppData } from '../context/AppDataContext';
import { resolveBookingStatus } from '../utils/bookingStatus';
import {
  getScheduleKpis,
  groupBookingsIntoSchedules,
  getScheduleBatchStatus,
  formatScheduleMoney,
} from '../utils/scheduleHelpers';
import { getTravelMonthOptions } from '../utils/bookingFilters';
import { formatMonthLabel, toMonthKey } from '../utils/datePeriods';
import { BATCH_SORT_OPTIONS, sortScheduleBatches } from '../utils/bookingSort';
import { formatDateForDisplay } from '../utils/helpers';

const VIEW_TABS = [
  { value: 'all', label: 'All' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

export default function SchedulePage() {
  const { bookings, navigateToBooking } = useAppData();
  const [viewTab, setViewTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('All months');
  const [sortKey, setSortKey] = useState('departure_asc');

  const monthOptions = getTravelMonthOptions(bookings);

  const groupedSchedules = useMemo(() => {
    let batches = groupBookingsIntoSchedules(bookings, { search, view: viewTab });
    if (monthFilter && monthFilter !== 'All months') {
      batches = batches.filter((batch) => toMonthKey(batch.travelStartDate) === monthFilter);
    }
    return sortScheduleBatches(batches, sortKey);
  }, [bookings, search, viewTab, monthFilter, sortKey]);

  const kpis = useMemo(() => getScheduleKpis(groupedSchedules), [groupedSchedules]);

  const tabs = VIEW_TABS.map((t) => ({
    ...t,
    count: groupBookingsIntoSchedules(bookings, { search: '', view: t.value }).length,
  }));

  return (
    <Box>
      <CustomBreadcrumbs links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'Schedule' }]} />
      <PageHeader title="Schedule" subtitle="Trip batches grouped by package and dates" />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Trip batches', value: kpis.totalBatches },
          { label: 'Total pax', value: kpis.totalPax },
          { label: 'Total advance', value: formatScheduleMoney(kpis.totalAdvance) },
          { label: 'Outstanding', value: formatScheduleMoney(kpis.totalBalance) },
        ].map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
              <Typography variant="h6" fontWeight={700}>{kpi.value}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ overflow: 'hidden' }}>
        <TableTabs tabs={tabs} value={viewTab} onChange={setViewTab} />
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search batches..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200 }} />
          <TextField select size="small" label="Month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="All months">All months</MenuItem>
            {monthOptions.map((k) => <MenuItem key={k} value={k}>{formatMonthLabel(k)}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Sort" value={sortKey} onChange={(e) => setSortKey(e.target.value)} sx={{ minWidth: 160 }}>
            {BATCH_SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        </Box>

        {groupedSchedules.map((batch) => (
          <Accordion key={batch.batchKey} defaultExpanded disableGutters elevation={0}>
            <AccordionSummary expandIcon={<i className="ri-arrow-down-s-line" />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', width: '100%' }}>
                <Typography fontWeight={700}>{batch.tripBatch}</Typography>
                <Typography variant="body2" color="text.secondary">{batch.destination}</Typography>
                <BookingStatusChip status={getScheduleBatchStatus(batch)} />
                <Typography variant="body2" sx={{ ml: 'auto' }}>{formatScheduleMoney(batch.totalPackageAmount)}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ref</TableCell>
                    <TableCell>Guest</TableCell>
                    <TableCell>Travel</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batch.bookings.map((booking) => (
                    <TableRow key={booking.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigateToBooking(booking)}>
                      <TableCell>
                        <Link component={RouterLink} to={`/bookings/${booking.id}`} underline="hover" onClick={(e) => e.stopPropagation()}>
                          {booking.bookingRef}
                        </Link>
                      </TableCell>
                      <TableCell>{booking.guestName}</TableCell>
                      <TableCell>{formatDateForDisplay(booking.travelStartDate)}</TableCell>
                      <TableCell><BookingStatusChip status={resolveBookingStatus(booking)} /></TableCell>
                      <TableCell align="right">{formatScheduleMoney(booking.packagePrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        ))}

        {!groupedSchedules.length && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No schedule batches match your filters.</Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
}
