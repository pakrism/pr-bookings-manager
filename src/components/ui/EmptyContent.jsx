import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function EmptyContent({ title, description, action, sx }) {
  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        textAlign: 'center',
        ...sx,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: 'grey.200',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
          fontSize: 28,
          color: 'text.secondary',
        }}
      >
        <i className="ri-inbox-line" />
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 2 : 0 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}
