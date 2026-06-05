import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';

export default function PackageFilters({
  open,
  onClose,
  destination,
  onDestinationChange,
  type,
  onTypeChange,
  activeOnly,
  onActiveOnlyChange,
  destinations,
  types,
  onReset,
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 320 } }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={onClose}>
          <i className="ri-close-line" />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          select
          label="Destination"
          value={destination}
          onChange={(e) => onDestinationChange(e.target.value)}
        >
          <MenuItem value="All">All destinations</MenuItem>
          {destinations.map((dest) => (
            <MenuItem key={dest} value={dest}>
              {dest}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Tour type"
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <MenuItem value="All">All types</MenuItem>
          {types.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>

        <FormControlLabel
          control={
            <Switch
              checked={activeOnly}
              onChange={(e) => onActiveOnlyChange(e.target.checked)}
            />
          }
          label="Active packages only"
        />

        <Button variant="outlined" onClick={onReset}>
          Reset filters
        </Button>
      </Box>
    </Drawer>
  );
}
