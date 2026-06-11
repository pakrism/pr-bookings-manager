import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { OutlineButton, SecondaryButton } from '../common/BrandButton';
import { formatCurrency } from '../../utils/helpers';

export default function PayoutSelectionBar({
  poolId,
  selectedCount,
  totalPoolShare,
  poolConfigs,
  shareKeys,
  includePartnerPool,
  onShareKeyToggle,
  onPartnerPoolToggle,
  onClear,
  onMarkPaid,
  onMarkUnpaid,
}) {
  const partnerLabel = poolId === 'zohaib' ? 'Zohaib' : 'Pervaiz';
  const hasPayoutSelection = includePartnerPool || shareKeys.length > 0;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        px: 2,
        py: 1.5,
        bgcolor: 'action.selected',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', md: 'center' }}
      >
        <Box sx={{ minWidth: 140 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {selectedCount} selected
          </Typography>
          {totalPoolShare > 0 && (
            <Typography variant="caption" color="text.secondary">
              Pool share {formatCurrency(totalPoolShare)}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ flex: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={includePartnerPool}
                onChange={(e) => onPartnerPoolToggle?.(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">Partner share — {partnerLabel}</Typography>
            }
          />
          {poolConfigs.map((config) => (
            <FormControlLabel
              key={config.shareKey}
              control={
                <Checkbox
                  size="small"
                  checked={shareKeys.includes(config.shareKey)}
                  onChange={(e) => onShareKeyToggle?.(config.shareKey, e.target.checked)}
                />
              }
              label={<Typography variant="body2">{config.label}</Typography>}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <OutlineButton type="button" onClick={onClear}>
            Clear
          </OutlineButton>
          <SecondaryButton
            type="button"
            disabled={!hasPayoutSelection}
            onClick={onMarkPaid}
          >
            Mark as paid
          </SecondaryButton>
          <OutlineButton
            type="button"
            disabled={!hasPayoutSelection}
            onClick={onMarkUnpaid}
          >
            Mark as unpaid
          </OutlineButton>
        </Stack>
      </Stack>
    </Box>
  );
}
