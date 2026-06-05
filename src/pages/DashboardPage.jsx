import { useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

import CustomBreadcrumbs from '../components/ui/CustomBreadcrumbs';
import AnalyticsWidgetSummary, { DarkIncomeCard } from '../components/ui/AnalyticsWidgetSummary';
import Chart from '../components/ui/Chart';
import { useChart } from '../components/ui/useChart';
import BookingStatusChip from '../components/common/BookingStatusChip';
import { SecondaryButton } from '../components/common/BrandButton';
import { computeDashboardMetrics, formatAuditTime } from '../utils/dashboardMetrics';
import { resolveBookingStatus } from '../utils/bookingStatus';
import { getBookingStatusCounts } from '../utils/bookingStatusCounts';
import { formatCurrency, formatDateForDisplay } from '../utils/helpers';
import { useAppData } from '../context/AppDataContext';

function ChartCard({ title, subheader, children, action }) {
  return (
    <Card sx={{ p: 3, height: '100%' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6">{title}</Typography>
          {subheader && (
            <Typography variant="body2" color="text.secondary">
              {subheader}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Card>
  );
}

function EmptyChartMessage({ message = 'No data yet' }) {
  return (
    <Box
      sx={{
        height: 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
      }}
    >
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { bookings, userProfile, isAdmin } = useAppData();
  const metrics = useMemo(() => computeDashboardMetrics(bookings), [bookings]);
  const statusCounts = useMemo(() => getBookingStatusCounts(bookings), [bookings]);
  const maxStatus = Math.max(...Object.values(statusCounts).filter((_, i, arr) => i > 0), 1);

  const statusChartOptions = useChart({
    labels: metrics.statusCounts.map((s) => s.label),
    legend: { show: true, position: 'bottom' },
    plotOptions: { pie: { donut: { size: '72%' } } },
    stroke: { width: 0 },
  });

  const revenueChartOptions = useChart({
    xaxis: {
      categories: metrics.monthlyRevenue.map((m) =>
        m.label.split(' ')[0].slice(0, 3)
      ),
    },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
    fill: { type: 'solid', opacity: 0.9 },
  });

  const packagesChartOptions = useChart({
    chart: { type: 'bar' },
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '60%' } },
    xaxis: { categories: metrics.topPackages.map((p) => p.name) },
    fill: { type: 'solid', opacity: 0.85 },
  });

  const radarMax = Math.max(...metrics.tourTypes.map((t) => t.value), 1);
  const radarChartOptions = useChart({
    xaxis: { categories: metrics.tourTypes.map((t) => t.label) },
    yaxis: { show: false, max: radarMax },
    stroke: { width: 2 },
    fill: { opacity: 0.24 },
    markers: { size: 4 },
  });

  const cityChartOptions = useChart({
    labels: metrics.topCities.map((c) => c.city),
    legend: { show: true, position: 'bottom' },
    stroke: { width: 0 },
    plotOptions: { pie: { donut: { size: '65%' } } },
  });

  return (
    <Box>
      <CustomBreadcrumbs links={[{ name: 'Dashboard' }]} />
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Overview for {userProfile?.fullName?.split(' ')[0] || 'team'}
        </Typography>
        {isAdmin && (
          <SecondaryButton onClick={() => navigate('/bookings/new')}>+ New Booking</SecondaryButton>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <DarkIncomeCard
            title="Total revenue"
            total={metrics.kpiWidgets.find((w) => w.id === 'revenue')?.total || formatCurrency(0)}
            percent={metrics.kpiWidgets.find((w) => w.id === 'revenue')?.percent}
            chartSeries={metrics.kpiWidgets.find((w) => w.id === 'revenue')?.chart?.series}
          />
        </Grid>
        {metrics.kpiWidgets.filter((w) => w.id !== 'revenue').map((widget) => (
          <Grid key={widget.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <AnalyticsWidgetSummary {...widget} color={widget.id === 'outstanding' ? 'warning' : widget.id === 'profit' ? 'success' : 'info'} />
          </Grid>
        ))}

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Booking status" subheader="Distribution">
            {['Upcoming', 'On-Going', 'Completed', 'Cancelled'].map((status) => (
              <Box key={status} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{status}</Typography>
                  <Typography variant="body2" fontWeight={700}>{statusCounts[status] || 0}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={((statusCounts[status] || 0) / maxStatus) * 100}
                  sx={{ height: 8, borderRadius: 1 }}
                  color={status === 'Cancelled' ? 'error' : status === 'Upcoming' ? 'warning' : 'success'}
                />
              </Box>
            ))}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8, lg: 4 }}>
          <ChartCard title="Bookings by status" subheader="Current distribution">
            {metrics.statusCounts.length ? (
              <Chart
                type="donut"
                series={metrics.statusCounts.map((s) => s.value)}
                options={statusChartOptions}
                height={300}
              />
            ) : (
              <EmptyChartMessage />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <ChartCard title="Monthly revenue" subheader="Last 8 months (departure month)">
            {metrics.monthlyRevenue.some((m) => m.revenue > 0) ? (
              <Chart
                type="bar"
                series={[{ name: 'Revenue', data: metrics.monthlyRevenue.map((m) => m.revenue) }]}
                options={revenueChartOptions}
                height={300}
              />
            ) : (
              <EmptyChartMessage />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <ChartCard title="Top packages" subheader="By booking count">
            {metrics.topPackages.length ? (
              <Chart
                type="bar"
                series={[{ name: 'Bookings', data: metrics.topPackages.map((p) => p.count) }]}
                options={packagesChartOptions}
                height={300}
              />
            ) : (
              <EmptyChartMessage />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <ChartCard title="Tour type mix" subheader="Group vs private">
            {metrics.tourTypes.length ? (
              <Chart
                type="radar"
                series={[{ name: 'Bookings', data: metrics.tourTypes.map((t) => t.value) }]}
                options={radarChartOptions}
                height={300}
              />
            ) : (
              <EmptyChartMessage />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ChartCard title="By departure city" subheader="Top 4 cities">
            {metrics.topCities.length ? (
              <Chart
                type="donut"
                series={metrics.topCities.map((c) => c.count)}
                options={cityChartOptions}
                height={300}
              />
            ) : (
              <EmptyChartMessage />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ChartCard title="Upcoming departures" subheader="Next 7 days">
            {metrics.upcomingDepartures.length ? (
              <List dense disablePadding>
                {metrics.upcomingDepartures.map((booking, index) => (
                  <Box key={booking.id}>
                    <ListItem
                      disableGutters
                      sx={{ cursor: 'pointer', py: 1 }}
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      <ListItemText
                        primary={booking.guestName}
                        secondary={`${formatDateForDisplay(booking.travelStartDate)} · ${booking.packageName || '-'}`}
                        primaryTypographyProps={{ fontWeight: 600, noWrap: true }}
                        secondaryTypographyProps={{ noWrap: true }}
                      />
                    </ListItem>
                    {index < metrics.upcomingDepartures.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            ) : (
              <EmptyChartMessage message="No departures in the next 7 days" />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <ChartCard title="Activity timeline" subheader="Recent audit log">
            {metrics.timelineEntries.length ? (
              <List dense disablePadding sx={{ maxHeight: 300, overflow: 'auto' }}>
                {metrics.timelineEntries.map((entry, index) => (
                  <Box key={entry.id}>
                    <ListItem disableGutters sx={{ py: 1, alignItems: 'flex-start' }}>
                      <ListItemText
                        primary={entry.summary || entry.action}
                        secondary={`${entry.bookingRef || '-'} · ${entry.byName || 'System'} · ${formatAuditTime(entry.at)}`}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItem>
                    {index < metrics.timelineEntries.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            ) : (
              <EmptyChartMessage message="No activity logged yet" />
            )}
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 0 }}>
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Recent bookings</Typography>
              <Button size="small" onClick={() => navigate('/bookings')}>
                View all
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ref</TableCell>
                    <TableCell>Guest</TableCell>
                    <TableCell>Package</TableCell>
                    <TableCell>Travel</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.recentBookings.length ? (
                    metrics.recentBookings.map((booking) => (
                      <TableRow
                        key={booking.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        <TableCell>{booking.bookingRef || '-'}</TableCell>
                        <TableCell>{booking.guestName}</TableCell>
                        <TableCell>{booking.packageName || '-'}</TableCell>
                        <TableCell>
                          {formatDateForDisplay(booking.travelStartDate)}
                        </TableCell>
                        <TableCell>
                          <BookingStatusChip status={resolveBookingStatus(booking)} />
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(booking.packagePrice)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No bookings yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
