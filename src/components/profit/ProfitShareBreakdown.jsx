import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { formatCurrency } from '../../utils/helpers';
import { getBookingProfit } from '../../utils/bookingFinancials';
import {
  getProfitDistribution,
  getProfitPoolAmount,
  isPartnerPoolPaid,
} from '../../utils/partnerProfit';
import { PROFIT_POOLS, POOL_IDS } from '../../data/profitPools';

function PoolSection({
  poolId,
  booking,
  canEdit,
  onTogglePaid,
  onTogglePartnerPaid,
  compact,
}) {
  const pool = PROFIT_POOLS[poolId];
  const poolAmount = getProfitPoolAmount(booking, poolId);
  const rows = getProfitDistribution(booking).filter((r) => r.poolId === poolId);
  const partnerPaid = isPartnerPoolPaid(booking, poolId);
  const partnerLabel = poolId === 'zohaib' ? 'Zohaib' : 'Pervaiz';

  if (!rows.length) return null;

  return (
    <Box sx={{ mb: compact ? 1.5 : 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
        <Typography variant={compact ? 'subtitle2' : 'subtitle1'} fontWeight={700}>
          {pool.label} (50%)
        </Typography>
        {poolAmount != null && (
          <Typography variant={compact ? 'body2' : 'subtitle1'} fontWeight={700}>
            {formatCurrency(poolAmount)}
          </Typography>
        )}
      </Stack>

      <Box
        sx={{
          px: 1.5,
          py: 1,
          mb: 1,
          borderRadius: 1,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
          border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={partnerPaid}
              disabled={!canEdit || !onTogglePartnerPaid}
              onChange={(e) => onTogglePartnerPaid?.(poolId, e.target.checked)}
            />
          }
          label={
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={600}>
                Partner share paid — {partnerLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {partnerPaid ? 'Settled' : 'Pending'}
              </Typography>
            </Stack>
          }
          sx={{ m: 0, width: '100%' }}
          onClick={(e) => e.stopPropagation()}
        />
      </Box>

      <List dense disablePadding>
        {rows.map((row, index) => (
          <Box key={row.shareKey}>
            {index > 0 && <Divider component="li" />}
            <ListItem
              disableGutters
              sx={{
                py: 0.75,
                opacity: row.paid ? 0.72 : 1,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={row.paid}
                    disabled={!canEdit || !onTogglePaid}
                    onChange={(e) => onTogglePaid?.(row.shareKey, e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2">
                    {row.label}{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                      ({row.percentOfPool}%)
                    </Typography>
                  </Typography>
                }
                sx={{ flex: 1, m: 0 }}
                onClick={(e) => e.stopPropagation()}
              />
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(row.amount)}
              </Typography>
            </ListItem>
          </Box>
        ))}
      </List>
    </Box>
  );
}

function ProfitShareBreakdown({
  booking,
  canEdit = false,
  onTogglePaid,
  onTogglePartnerPaid,
  compact = false,
  poolId = null,
}) {
  const profit = getBookingProfit(booking);
  const distribution = getProfitDistribution(booking);

  if (profit == null || !distribution.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Set profit to see distribution breakdown.
      </Typography>
    );
  }

  const poolsToShow = poolId && POOL_IDS.includes(poolId) ? [poolId] : POOL_IDS;

  return (
    <Box>
      {poolsToShow.map((id) => (
        <PoolSection
          key={id}
          poolId={id}
          booking={booking}
          canEdit={canEdit}
          onTogglePaid={onTogglePaid}
          onTogglePartnerPaid={onTogglePartnerPaid}
          compact={compact}
        />
      ))}
    </Box>
  );
}

export default ProfitShareBreakdown;
