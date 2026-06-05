import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';

import { formatCurrency, getPackageImage } from '../../utils/helpers';

export default function PackageCard({ pkg, onEdit, onDelete, canEdit }) {
  const isActive = pkg.isActive !== false;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height={180}
        image={getPackageImage(pkg.imageUrl)}
        alt={pkg.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {pkg.name}
          </Typography>
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            size="small"
            color={isActive ? 'success' : 'default'}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
          {pkg.destination || '-'}
        </Typography>
        {pkg.type && (
          <Chip label={pkg.type} size="small" variant="outlined" sx={{ mt: 0.5 }} />
        )}
        <Typography variant="h6" color="primary.main" sx={{ mt: 1.5 }}>
          {formatCurrency(pkg.pricePerPerson)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {pkg.duration || '-'}
        </Typography>
      </CardContent>
      {canEdit && (
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          <IconButton size="small" onClick={() => onEdit(pkg)} aria-label="Edit package">
            <i className="ri-edit-line" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(pkg.id)}
            aria-label="Delete package"
          >
            <i className="ri-delete-bin-line" />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
}
