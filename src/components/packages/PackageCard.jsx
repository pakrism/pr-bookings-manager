import { useState } from 'react';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Label from '../ui/Label';
import { formatCurrency, getPackageImage } from '../../utils/helpers';

export default function PackageCard({ pkg, bookingCount = 0, onEdit, onDelete, canEdit }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const isActive = pkg.isActive !== false;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height={200}
          image={getPackageImage(pkg.imageUrl)}
          alt={pkg.name}
          sx={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            bgcolor: alpha('#000', 0.64),
            color: '#fff',
            fontSize: '0.8125rem',
            fontWeight: 700,
          }}
        >
          {formatCurrency(pkg.pricePerPerson)}
        </Box>
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Label sx={{ bgcolor: isActive ? undefined : undefined }}>{isActive ? 'Active' : 'Inactive'}</Label>
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom noWrap>
          {pkg.name}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="ri-map-pin-line" style={{ color: '#FFAD32' }} />
            <Typography variant="body2" color="text.secondary" noWrap>{pkg.destination || '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="ri-time-line" style={{ color: '#00B8D9' }} />
            <Typography variant="body2" color="text.secondary">{pkg.duration || '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="ri-group-line" style={{ color: '#58C71B' }} />
            <Typography variant="body2" color="text.secondary">{bookingCount} booked</Typography>
          </Box>
        </Box>
      </CardContent>

      {canEdit && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          <IconButton size="small" onClick={() => onEdit(pkg)}>
            <i className="ri-pencil-line" />
          </IconButton>
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <i className="ri-more-2-fill" />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => { setAnchorEl(null); onEdit(pkg); }}>Edit</MenuItem>
            <MenuItem sx={{ color: 'error.main' }} onClick={() => { setAnchorEl(null); onDelete(pkg.id); }}>Delete</MenuItem>
          </Menu>
        </CardActions>
      )}
    </Card>
  );
}
