import { useState } from 'react';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
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
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function BookingTableRow({
  row,
  selected,
  onSelectRow,
  onView,
  onEdit,
  onDelete,
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
    <TableRow
      hover
      selected={selected}
      sx={{ cursor: 'pointer' }}
      onClick={() => onView?.(row)}
    >
      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onChange={() => onSelectRow(row.id)} />
      </TableCell>
      <TableCell>{row.bookingRef || '-'}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
            {getInitials(row.guestName)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {row.guestName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.departureCity || '-'} · {normalizeBookingTourType(row.type)}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {row.packageName || '-'}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {row.destination || '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {formatDateForDisplay(row.travelStartDate)} →{' '}
          {formatDateForDisplay(row.travelEndDate)}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {row.transport || '-'}
        </Typography>
      </TableCell>
      <TableCell>
        <BookingStatusChip status={resolvedStatus} />
      </TableCell>
      <TableCell align="right">{formatCurrency(row.packagePrice)}</TableCell>
      <TableCell align="right">
        {profit != null ? (
          <Box>
            <Typography variant="body2">{formatCurrency(profit)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {profitPercentage?.toFixed(1) ?? '-'}%
            </Typography>
          </Box>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
          }}
        >
          <i className="ri-more-2-fill" />
        </IconButton>
        <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
          {whatsappLink && (
            <MenuItem
              component="a"
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              onClick={() => setAnchorEl(null)}
            >
              WhatsApp
            </MenuItem>
          )}
          {canEdit && [
            <MenuItem
              key="edit"
              onClick={() => {
                setAnchorEl(null);
                onEdit?.(row);
              }}
            >
              Edit
            </MenuItem>,
            <Divider key="div" />,
            <MenuItem
              key="delete"
              sx={{ color: 'error.main' }}
              onClick={() => {
                setAnchorEl(null);
                onDelete?.(row.id);
              }}
            >
              Delete
            </MenuItem>,
          ]}
        </Menu>
      </TableCell>
    </TableRow>
  );
}
