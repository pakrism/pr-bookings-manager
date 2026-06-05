import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';

import BookingStatusChip from '../common/BookingStatusChip';
import { formatCurrency, formatDateForDisplay } from '../../utils/helpers';
import { getBookingProfit } from '../../utils/bookingFinancials';
import { resolveBookingStatus } from '../../utils/bookingStatus';
import { normalizeBookingTourType } from '../../utils/tourType';
import { getProfitPercentage } from '../../utils/revenueMetrics';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function BookingTableRow({
  row,
  selected,
  onSelectRow,
  onView,
  onEdit,
  onDelete,
  onQuickUpdate,
  canEdit,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const resolvedStatus = row._status || resolveBookingStatus(row);
  const profit = row._profit ?? getBookingProfit(row);
  const profitPercentage = getProfitPercentage(profit, row.packagePrice);

  const whatsappLink = row.whatsappNumber
    ? `https://wa.me/${row.whatsappNumber.replace(/[^\d]/g, '')}`
    : null;

  return (
    <TableRow hover selected={selected} sx={{ cursor: 'pointer' }} onClick={() => onView?.(row)}>
      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onChange={() => onSelectRow(row.id)} />
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Link
          component={RouterLink}
          to={`/bookings/${row.id}`}
          underline="hover"
          fontWeight={700}
          color="text.primary"
        >
          {row.bookingRef || '-'}
        </Link>
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'grey.800', fontSize: 14 }}>
            {getInitials(row.guestName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>{row.guestName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.departureCity || '-'} · {normalizeBookingTourType(row.type)}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>{row.packageName || '-'}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{row.destination || '-'}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>{formatDateForDisplay(row.travelStartDate)}</Typography>
        <Typography variant="caption" color="text.secondary">{row.transport || '-'}</Typography>
      </TableCell>
      <TableCell><BookingStatusChip status={resolvedStatus} /></TableCell>
      <TableCell align="right">{formatCurrency(row.packagePrice)}</TableCell>
      <TableCell align="right">
        {profit != null ? (
          <Box>
            <Typography variant="body2">{formatCurrency(profit)}</Typography>
            <Typography variant="caption" color="text.secondary">{profitPercentage?.toFixed(1) ?? '-'}%</Typography>
          </Box>
        ) : '-'}
      </TableCell>
      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        {canEdit && (
          <IconButton size="small" onClick={() => onEdit?.(row)}>
            <i className="ri-pencil-line" />
          </IconButton>
        )}
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
          <i className="ri-more-2-fill" />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
          {whatsappLink && (
            <MenuItem component="a" href={whatsappLink} target="_blank" rel="noreferrer">WhatsApp</MenuItem>
          )}
          {canEdit && (
            <MenuItem onClick={() => { setAnchorEl(null); onQuickUpdate?.(row); }}>Quick update</MenuItem>
          )}
          {canEdit && (
            <MenuItem onClick={() => { setAnchorEl(null); onEdit?.(row); }}>Edit</MenuItem>
          )}
          {canEdit && [<Divider key="d" />, <MenuItem key="del" sx={{ color: 'error.main' }} onClick={() => { setAnchorEl(null); onDelete?.(row.id); }}>Delete</MenuItem>]}
        </Menu>
      </TableCell>
    </TableRow>
  );
}
