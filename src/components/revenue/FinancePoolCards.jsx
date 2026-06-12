import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';

import { PrimaryButton } from '../common/BrandButton';
import { formatCurrency } from '../../utils/helpers';
import { getPoolSplitLabel } from '../../data/profitPools';
import { getPoolPaidSummary } from '../../utils/partnerProfit';

const POOL_ICONS = {
  zohaib: 'ri-user-line',
  pervaiz: 'ri-user-line',
};

export function PoolEntryCard({
  title,
  poolId,
  poolTotal,
  partnerSummary,
  recipientSummary,
  splitLabel,
  onOpen,
}) {
  const partnerTotal = partnerSummary.paidTotal + partnerSummary.unpaidTotal;
  const partnerPaidPercent =
    partnerTotal > 0 ? Math.round((partnerSummary.paidTotal / partnerTotal) * 100) : 0;
  const recipientTotal = recipientSummary.paidTotal + recipientSummary.unpaidTotal;
  const recipientPaidPercent =
    recipientTotal > 0 ? Math.round((recipientSummary.paidTotal / recipientTotal) * 100) : 0;

  return (
    <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <i className={POOL_ICONS[poolId] || 'ri-user-line'} style={{ fontSize: 20, color: '#58C71B' }} />
          <Typography variant="h6">{title}</Typography>
        </Stack>
        <Chip label="50% pool" size="small" variant="outlined" />
      </Stack>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
        {formatCurrency(poolTotal)}
      </Typography>

      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          Partner settlement {partnerPaidPercent}%
        </Typography>
        <LinearProgress variant="determinate" value={partnerPaidPercent} sx={{ mt: 0.5, height: 6, borderRadius: 999 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Paid {formatCurrency(partnerSummary.paidTotal)} · Unpaid {formatCurrency(partnerSummary.unpaidTotal)}
        </Typography>
      </Box>

      <Box sx={{ mb: 2, flex: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Recipients settled {recipientPaidPercent}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={recipientPaidPercent}
          color="info"
          sx={{ mt: 0.5, height: 6, borderRadius: 999 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Paid {formatCurrency(recipientSummary.paidTotal)} · Unpaid {formatCurrency(recipientSummary.unpaidTotal)}
        </Typography>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
        {splitLabel}
      </Typography>
      <PrimaryButton type="button" onClick={onOpen}>
        View pool
        <i className="ri-arrow-right-line" style={{ marginLeft: 6 }} />
      </PrimaryButton>
    </Card>
  );
}

export default function FinancePoolCards({
  metrics,
  onOpenPoolTab,
  visiblePoolIds = null,
  linkMode = false,
}) {
  const navigate = useNavigate();

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
  const showZohaib = !visiblePoolIds || visiblePoolIds.includes('zohaib');
  const showPervaiz = !visiblePoolIds || visiblePoolIds.includes('pervaiz');

  function openPool(poolId) {
    if (linkMode) {
      navigate(`/finance/${poolId}`);
      return;
    }
    onOpenPoolTab?.(poolId);
  }

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {showZohaib && (
        <Grid size={{ xs: 12, md: showPervaiz ? 6 : 12 }}>
          <PoolEntryCard
            title="Zohaib pool"
            poolId="zohaib"
            poolTotal={zohaibTotal}
            partnerSummary={zohaibPartnerSummary}
            recipientSummary={zohaibRecipientSummary}
            splitLabel={getPoolSplitLabel('zohaib')}
            onOpen={() => openPool('zohaib')}
          />
        </Grid>
      )}
      {showPervaiz && (
        <Grid size={{ xs: 12, md: showZohaib ? 6 : 12 }}>
          <PoolEntryCard
            title="Pervaiz pool"
            poolId="pervaiz"
            poolTotal={pervaizTotal}
            partnerSummary={pervaizPartnerSummary}
            recipientSummary={pervaizRecipientSummary}
            splitLabel={getPoolSplitLabel('pervaiz')}
            onOpen={() => openPool('pervaiz')}
          />
        </Grid>
      )}
    </Grid>
  );
}
