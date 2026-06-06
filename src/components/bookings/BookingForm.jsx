import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';

import {
  BOOKED_BY_OPTIONS,
  BOOKING_TOUR_TYPES,
  MANUAL_BOOKING_STATUSES,
  groupTypes,
  transportOptions,
} from '../../data/constants';
import { formatCurrency } from '../../utils/helpers';
import BookingStatusChip from '../common/BookingStatusChip';
import FormSection from '../ui/FormSection';
import {
  SecondaryButton,
  OutlineButton,
  DarkButton,
} from '../common/BrandButton';
import { resolveFormBookingStatus } from '../../utils/bookingStatus';
import { computeRemainingAmount, getTotalPaid } from '../../utils/payments';
import ProfitShareBreakdown from '../profit/ProfitShareBreakdown';

function fieldChange(onChange) {
  return (event) => onChange(event);
}

function BookingForm({
  bookingForm,
  editingBookingId,
  packages,
  onChange,
  onPackageChange,
  onPaymentChange,
  onAddPayment,
  onRemovePayment,
  onApplySuggestedPrice,
  suggestedPackagePrice,
  onSubmit,
  onClose,
  isSubmitting = false,
  readOnly = false,
}) {
  const totalPersons =
    Number(bookingForm.adults || 0) +
    Number(bookingForm.children || 0) +
    Number(bookingForm.infants || 0);

  const autoStatus = resolveFormBookingStatus(bookingForm);
  const totalPaid = getTotalPaid(bookingForm.payments || []);
  const balance = computeRemainingAmount(
    bookingForm.packagePrice,
    totalPaid,
    autoStatus
  );

  const payments = bookingForm.payments?.length ? bookingForm.payments : [];
  const disabled = readOnly || isSubmitting;

  return (
    <Box component="form" onSubmit={onSubmit}>
      <fieldset disabled={disabled} style={{ border: 'none', margin: 0, padding: 0, minWidth: 0 }}>
        <FormSection
          title="Guest & tour"
          subtitle="Guest details and package selection"
          action={
            <Chip label={`${totalPersons} travellers`} size="small" variant="outlined" />
          }
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Guest name"
                name="guestName"
                value={bookingForm.guestName}
                onChange={fieldChange(onChange)}
                placeholder="Full name of the guest"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="WhatsApp number"
                name="whatsappNumber"
                value={bookingForm.whatsappNumber}
                onChange={fieldChange(onChange)}
                placeholder="+92 3xx xxxxxxx"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                select
                label="Package"
                name="packageTemplateId"
                value={bookingForm.packageTemplateId}
                onChange={onPackageChange}
              >
                <MenuItem value="">Select package</MenuItem>
                {packages.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                select
                label="Tour type"
                name="type"
                value={bookingForm.type}
                onChange={fieldChange(onChange)}
              >
                {BOOKING_TOUR_TYPES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Departure city"
                name="departureCity"
                value={bookingForm.departureCity}
                onChange={fieldChange(onChange)}
                placeholder="e.g. Islamabad"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Booked by"
                name="bookedBy"
                value={bookingForm.bookedBy}
                onChange={fieldChange(onChange)}
              >
                <MenuItem value="">Select</MenuItem>
                {BOOKED_BY_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Travel details" subtitle="Dates, transport, and accommodation">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Transport"
                name="transport"
                value={bookingForm.transport}
                onChange={fieldChange(onChange)}
              >
                <MenuItem value="">Select transport</MenuItem>
                {transportOptions.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Accommodation"
                name="accommodation"
                value={bookingForm.accommodation}
                onChange={fieldChange(onChange)}
                placeholder="e.g. Hotel Serena, 3-star"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                type="date"
                label="Departure date"
                name="travelStartDate"
                value={bookingForm.travelStartDate}
                onChange={fieldChange(onChange)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                type="date"
                label="Return date"
                name="travelEndDate"
                value={bookingForm.travelEndDate}
                onChange={fieldChange(onChange)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection title="Persons" subtitle="Group size and composition">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                label="Adults"
                name="adults"
                value={bookingForm.adults}
                onChange={fieldChange(onChange)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                label="Children"
                name="children"
                value={bookingForm.children}
                onChange={fieldChange(onChange)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                label="Infants"
                name="infants"
                value={bookingForm.infants}
                onChange={fieldChange(onChange)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Group type"
                name="groupType"
                value={bookingForm.groupType}
                onChange={fieldChange(onChange)}
              >
                {groupTypes.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {bookingForm.groupType === 'Other' && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Other group note"
                  name="groupTypeNote"
                  value={bookingForm.groupTypeNote}
                  onChange={fieldChange(onChange)}
                  placeholder="e.g. 3 colleagues"
                />
              </Grid>
            )}
          </Grid>
        </FormSection>

        <FormSection title="Notes" subtitle="Special requests or internal notes">
          <TextField
            fullWidth
            multiline
            minRows={4}
            label="Special notes"
            name="specialNotes"
            value={bookingForm.specialNotes}
            onChange={fieldChange(onChange)}
            placeholder="Any special requests or notes..."
          />
        </FormSection>

        <FormSection title="Payment & financials" subtitle="Pricing, payments, profit, and status">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                label="Package price (PKR)"
                name="packagePrice"
                value={bookingForm.packagePrice}
                onChange={fieldChange(onChange)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  Suggested price
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" fontWeight={700}>
                    {formatCurrency(suggestedPackagePrice || 0)}
                  </Typography>
                  {!readOnly && suggestedPackagePrice > 0 && (
                    <SecondaryButton type="button" size="small" onClick={onApplySuggestedPrice}>
                      Apply
                    </SecondaryButton>
                  )}
                </Stack>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3, mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Payments
            </Typography>
            {!readOnly && (
              <SecondaryButton type="button" size="small" onClick={onAddPayment}>
                + Add payment
              </SecondaryButton>
            )}
          </Stack>

          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {payments.map((payment, index) => (
              <Card
                key={payment.id || index}
                variant="outlined"
                sx={{ p: 2, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      inputProps={{ min: 0 }}
                      label="Amount"
                      value={payment.amount}
                      onChange={(e) => onPaymentChange(index, 'amount', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Paid on"
                      value={payment.paidAt}
                      onChange={(e) => onPaymentChange(index, 'paidAt', e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Note"
                      value={payment.note}
                      onChange={(e) => onPaymentChange(index, 'note', e.target.value)}
                      placeholder="Optional"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }}>
                    {!readOnly && payments.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => onRemovePayment(index)}
                        aria-label="Remove payment"
                      >
                        <i className="ri-delete-bin-line" />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Card>
            ))}
          </Stack>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Alert severity="info" icon={false} sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Total paid
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatCurrency(totalPaid)}
                </Typography>
              </Alert>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Alert severity={balance > 0 ? 'warning' : 'success'} icon={false} sx={{ py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Balance due
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {formatCurrency(balance)}
                </Typography>
              </Alert>
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
            Financials
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Profit = package price − total expenses.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
                label="Total expenses (PKR)"
                name="totalExpenses"
                value={bookingForm.totalExpenses}
                onChange={fieldChange(onChange)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Total profit (PKR)"
                name="totalProfit"
                value={bookingForm.totalProfit}
                onChange={fieldChange(onChange)}
              />
            </Grid>
          </Grid>

          {(bookingForm.totalProfit !== '' || bookingForm.totalExpenses !== '') && (
            <Box sx={{ mt: 2 }}>
              <ProfitShareBreakdown booking={bookingForm} compact />
            </Box>
          )}

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Status (auto from dates)
              </Typography>
              <BookingStatusChip status={autoStatus} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Status override"
                name="statusOverride"
                value={bookingForm.statusOverride}
                onChange={fieldChange(onChange)}
              >
                <MenuItem value="">None (use dates)</MenuItem>
                {MANUAL_BOOKING_STATUSES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </FormSection>
      </fieldset>

      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          mt: 3,
          py: 2,
          px: 3,
          mx: -3,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1.5,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <OutlineButton type="button" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </OutlineButton>
        {!readOnly && (
          <DarkButton type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving...'
              : editingBookingId
                ? 'Save changes'
                : 'Create booking'}
          </DarkButton>
        )}
      </Box>
    </Box>
  );
}

export default BookingForm;
