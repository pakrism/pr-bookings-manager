import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';

import { useAppData } from '../context/AppDataContext';
import { useBookingFromParams } from '../context/AppDataProvider';
import CustomBreadcrumbs from '../components/ui/CustomBreadcrumbs';
import BookingStatusChip from '../components/common/BookingStatusChip';
import { DarkButton, OutlineButton } from '../components/common/BrandButton';
import ProfitShareBreakdown from '../components/profit/ProfitShareBreakdown';
import { formatCurrency, formatDateForDisplay, getPackageImage } from '../utils/helpers';
import { getBookingProfit, getBookingExpenses, hasBookingFinancials } from '../utils/bookingFinancials';
import { getBookingBalance } from '../utils/bookingBalance';
import { resolveBookingStatus } from '../utils/bookingStatus';
import {
  getLedgerWithRunningCash,
  getTotalPaid,
  getNetCashPosition,
} from '../utils/payments';
import { generateInvoicePDF } from '../utils/invoice';
import { formatAuditTime } from '../utils/dashboardMetrics';
import BookingQuickUpdateDialog from '../components/bookings/BookingQuickUpdateDialog';

function DetailCard({ title, children, onEdit }) {
  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        {onEdit && (
          <IconButton size="small" onClick={onEdit}>
            <i className="ri-pencil-line" />
          </IconButton>
        )}
      </Box>
      {children}
    </Card>
  );
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600}>{value ?? '-'}</Typography>
    </Box>
  );
}

function formatPaxBreakdown(booking) {
  const adults = Number(booking.adults || 0);
  const children = Number(booking.children || 0);
  const infants = Number(booking.infants || 0);
  const total = adults + children + infants;
  const parts = [];
  if (adults) parts.push(`${adults} adult${adults === 1 ? '' : 's'}`);
  if (children) parts.push(`${children} child${children === 1 ? '' : 'ren'}`);
  if (infants) parts.push(`${infants} infant${infants === 1 ? '' : 's'}`);
  return `${total} pax${parts.length ? ` · ${parts.join(', ')}` : ''}`;
}

function formatGroupType(booking) {
  if (!booking.groupType) return '-';
  if (booking.groupType === 'Other' && booking.groupTypeNote) {
    return `${booking.groupType} (${booking.groupTypeNote})`;
  }
  return booking.groupType;
}

export default function BookingDetailPage() {
  const navigate = useNavigate();
  const booking = useBookingFromParams();
  const {
    isAdmin,
    navigateToEditBooking,
    setQuickUpdateBooking,
    quickUpdateBooking,
    handleToggleProfitSharePaid,
    handleTogglePartnerPoolPaid,
    packages,
  } = useAppData();

  if (!booking) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography>Booking not found.</Typography>
        <OutlineButton sx={{ mt: 2 }} onClick={() => navigate('/bookings')}>
          Back to list
        </OutlineButton>
      </Box>
    );
  }

  const resolvedStatus = resolveBookingStatus(booking);
  const ledgerRows = getLedgerWithRunningCash(booking.payments || []);
  const balance = getBookingBalance(booking);
  const totalPaid = getTotalPaid(booking);
  const totalExpenses = getBookingExpenses(booking);
  const profit = getBookingProfit(booking);
  const netCash = getNetCashPosition(booking);
  const pkg = packages.find((p) => p.id === booking.packageTemplateId);

  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Bookings', href: '/bookings' },
    { name: booking.bookingRef || booking.id },
  ];

  return (
    <Box>
      <CustomBreadcrumbs links={breadcrumbs} />

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/bookings')}>
            <i className="ri-arrow-left-line" />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h4">Booking {booking.bookingRef}</Typography>
              <BookingStatusChip status={resolvedStatus} />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatAuditTime(booking.createdAt)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {isAdmin && (
            <OutlineButton onClick={() => setQuickUpdateBooking(booking)}>
              Quick update
            </OutlineButton>
          )}
          <OutlineButton onClick={() => generateInvoicePDF(booking)}>
            Print invoice
          </OutlineButton>
          {isAdmin && (
            <DarkButton onClick={() => navigateToEditBooking(booking)}>
              Edit
            </DarkButton>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <DetailCard title="Details" onEdit={isAdmin ? () => navigateToEditBooking(booking) : null}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              {pkg && (
                <Box
                  component="img"
                  src={getPackageImage(pkg.imageUrl)}
                  alt={booking.packageName}
                  sx={{ width: 80, height: 80, borderRadius: 2, objectFit: 'cover' }}
                />
              )}
              <Box>
                <Typography fontWeight={700}>{booking.packageName}</Typography>
                <Typography variant="body2" color="text.secondary">{booking.destination}</Typography>
                <Typography variant="body2">{booking.duration}</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <InfoRow label="Package price" value={formatCurrency(booking.packagePrice)} />
            <InfoRow label="Travel dates" value={`${formatDateForDisplay(booking.travelStartDate)} → ${formatDateForDisplay(booking.travelEndDate)}`} />
            <InfoRow label="Tour type" value={booking.type || '-'} />
            <InfoRow label="Persons" value={formatPaxBreakdown(booking)} />
            <InfoRow label="Group type" value={formatGroupType(booking)} />
            {booking.specialNotes && (
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                {booking.specialNotes}
              </Typography>
            )}
          </DetailCard>

          <DetailCard title="History">
            <Box sx={{ pl: 1 }}>
              {(booking.auditLog || []).slice().reverse().map((entry, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, pb: 2, position: 'relative' }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: index === 0 ? 'primary.main' : 'grey.400',
                      mt: 0.75,
                      flexShrink: 0,
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle2">{entry.summary || entry.action}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.byName || 'System'} · {formatAuditTime(entry.at || entry.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {!booking.auditLog?.length && (
                <Typography variant="body2" color="text.secondary">No history yet.</Typography>
              )}
            </Box>
          </DetailCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <DetailCard title="Customer">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {booking.guestName?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{booking.guestName}</Typography>
                {booking.whatsappNumber && (
                  <Typography variant="body2" color="text.secondary">{booking.whatsappNumber}</Typography>
                )}
              </Box>
            </Box>
          </DetailCard>

          <DetailCard title="Travel">
            <InfoRow label="Departure city" value={booking.departureCity} />
            <InfoRow label="Transport" value={booking.transport} />
            <InfoRow label="Accommodation" value={booking.accommodation} />
          </DetailCard>

          <DetailCard title="Payment">
            <InfoRow label="Package price" value={formatCurrency(booking.packagePrice)} />
            <InfoRow label="Total paid" value={formatCurrency(totalPaid)} />
            <InfoRow label="Balance due" value={formatCurrency(balance)} />
            {totalExpenses != null && (
              <InfoRow label="Total expenses" value={formatCurrency(totalExpenses)} />
            )}
            {profit != null && (
              <InfoRow label="Profit" value={formatCurrency(profit)} />
            )}
            <InfoRow label="Net cash on hand" value={formatCurrency(netCash)} />

            {ledgerRows.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Ledger
                </Typography>
                {ledgerRows.map((entry) => (
                  <Box
                    key={entry.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      py: 0.75,
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                        <Chip
                          size="small"
                          label={entry.type === 'credit' ? 'Credit' : 'Debit'}
                          color={entry.type === 'credit' ? 'success' : 'warning'}
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDateForDisplay(entry.paidAt)}
                        </Typography>
                      </Stack>
                      <Typography variant="body2">
                        {entry.note || (entry.type === 'credit' ? 'Client payment' : 'Expense')}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {entry.type === 'credit' ? '+' : '-'}
                        {formatCurrency(entry.amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Net {formatCurrency(entry.runningCash)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </DetailCard>

          {hasBookingFinancials(booking) && (
            <DetailCard title="Profit">
              <InfoRow label="Profit" value={formatCurrency(profit)} />
              <Box sx={{ mt: 2 }}>
                <ProfitShareBreakdown
                  booking={booking}
                  canEdit={isAdmin}
                  onTogglePaid={(shareKey, paid) =>
                    handleToggleProfitSharePaid(booking.id, shareKey, paid)
                  }
                  onTogglePartnerPaid={(poolId, paid) =>
                    handleTogglePartnerPoolPaid(booking.id, poolId, paid)
                  }
                />
              </Box>
            </DetailCard>
          )}
        </Grid>
      </Grid>

      {quickUpdateBooking?.id === booking.id && (
        <BookingQuickUpdateDialog
          booking={booking}
          open
          onClose={() => setQuickUpdateBooking(null)}
        />
      )}
    </Box>
  );
}
