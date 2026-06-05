import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

export default function TableToolbar({
  searchValue,
  onSearchChange,
  placeholder = 'Search...',
  filterSlot,
  onFilterClick,
  filterLabel = 'Filters',
}) {
  return (
    <Box
      sx={{
        p: 2.5,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <TextField
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        sx={{ flexGrow: 1, minWidth: 200 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <i className="ri-search-line" style={{ fontSize: 20, opacity: 0.5 }} />
            </InputAdornment>
          ),
        }}
      />

      {filterSlot}

      {onFilterClick && (
        <Tooltip title={filterLabel}>
          <IconButton onClick={onFilterClick}>
            <i className="ri-filter-3-line" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
