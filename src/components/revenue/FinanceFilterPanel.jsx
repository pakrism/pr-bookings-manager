import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

import { OutlineButton } from '../common/BrandButton';
import { PERIOD_PRESETS } from './revenueConstants';
import { BOOKED_BY_OPTIONS } from '../../data/constants';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'On-Going', label: 'On-Going' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Refunded', label: 'Refunded' },
];

const PAYOUT_FILTER_OPTIONS = [
  { value: 'all', label: 'All payouts' },
  { value: 'partner_unpaid', label: 'Partner unpaid' },
  { value: 'recipient_unpaid', label: 'Any recipient unpaid' },
];

export default function FinanceFilterPanel({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  statusFilter,
  onStatusFilterChange,
  bookedByFilter,
  onBookedByFilterChange,
  payoutFilter,
  onPayoutFilterChange,
  onExport,
  compact = false,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <Card sx={{ mb: compact ? 2 : 3, p: compact ? { py: 1.25, px: 1.5 } : 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={compact ? 1 : 2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 1 : 2, alignItems: 'center', flex: 1 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value={preset} onChange={(e) => onPresetChange(e.target.value)} displayEmpty>
              {PERIOD_PRESETS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {preset === 'custom' && (
            <>
              <TextField
                size="small"
                type="date"
                label="Start date"
                value={customStart}
                onChange={(e) => onCustomStartChange(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 160 }}
              />
              <TextField
                size="small"
                type="date"
                label="End date"
                value={customEnd}
                onChange={(e) => onCustomEndChange(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 160 }}
              />
            </>
          )}

          <OutlineButton type="button" onClick={() => setFiltersOpen((open) => !open)}>
            More filters
            <IconButton size="small" component="span" sx={{ ml: 0.5 }}>
              <i className={filtersOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
            </IconButton>
          </OutlineButton>

          {compact && (
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
              · Departure month
            </Typography>
          )}
        </Box>

        <OutlineButton type="button" onClick={onExport}>
          Export CSV
        </OutlineButton>
      </Stack>

      {!compact && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Money counted by departure month
        </Typography>
      )}

      <Collapse in={filtersOpen}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 2 }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={bookedByFilter} onChange={(e) => onBookedByFilterChange(e.target.value)}>
              <MenuItem value="all">All booked by</MenuItem>
              {BOOKED_BY_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <Select value={payoutFilter} onChange={(e) => onPayoutFilterChange(e.target.value)}>
              {PAYOUT_FILTER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Collapse>
    </Card>
  );
}
