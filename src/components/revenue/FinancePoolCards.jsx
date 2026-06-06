import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';

import { PrimaryButton } from '../common/BrandButton';
import { formatCurrency } from '../../utils/helpers';
import { getPoolSplitLabel } from '../../data/profitPools';
import { getPoolPaidSummary } from '../../utils/partnerProfit';

export function PoolEntryCard({
  title,
  poolTotal,
  partnerSummary,
  recipientSummary,
  splitLabel,
  onOpen,
}) {
  return (
    <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">{title}</Typography>
        <Chip label="50% pool" size="small" variant="outlined" />
      </Stack>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
        {formatCurrency(poolTotal)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Partner share — Paid {formatCurrency(partnerSummary.paidTotal)} · Unpaid{' '}
        {formatCurrency(partnerSummary.unpaidTotal)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        In-pool recipients — Paid {formatCurrency(recipientSummary.paidTotal)} · Unpaid{' '}
        {formatCurrency(recipientSummary.unpaidTotal)}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
        {splitLabel}
      </Typography>
      <PrimaryButton type="button" onClick={onOpen}>
        View breakdown
      </PrimaryButton>
    </Card>
  );
}

export default function FinancePoolCards({ metrics, onOpenPoolTab }) {
  const zohaibRecipientSummary = useMemo(
    () => getPoolPaidSummary(metrics.recipientTotals, 'zohaib'),
    [metrics.recipientTotals]
  );
  const pervaizRecipientSummary = useMemo(
    () => getPoolPaidSummary(metrics.recipientTotals, 'pervaiz'),
    [metrics.recipientTotals]
  );

  const zohaibPartnerSummary = metrics.partnerPoolTotals?.zohaib || {
    paidTotal: 0,
    unpaidTotal: 0,
  };
  const pervaizPartnerSummary = metrics.partnerPoolTotals?.pervaiz || {
    paidTotal: 0,
    unpaidTotal: 0,
  };

  const zohaibTotal = metrics.poolTotals?.zohaib ?? 0;
  const pervaizTotal = metrics.poolTotals?.pervaiz ?? 0;

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <PoolEntryCard
          title="Zohaib pool"
          poolTotal={zohaibTotal}
          partnerSummary={zohaibPartnerSummary}
          recipientSummary={zohaibRecipientSummary}
          splitLabel={getPoolSplitLabel('zohaib')}
          onOpen={() => onOpenPoolTab('zohaib')}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <PoolEntryCard
          title="Pervaiz pool"
          poolTotal={pervaizTotal}
          partnerSummary={pervaizPartnerSummary}
          recipientSummary={pervaizRecipientSummary}
          splitLabel={getPoolSplitLabel('pervaiz')}
          onOpen={() => onOpenPoolTab('pervaiz')}
        />
      </Grid>
    </Grid>
  );
}
