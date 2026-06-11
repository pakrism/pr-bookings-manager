import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Logo from '../logo/Logo';

export default function AppLoadingScreen() {
  return (
    <div className="auth-shell">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          width: '100%',
          maxWidth: 320,
        }}
      >
        <Logo />
        <CircularProgress size={36} sx={{ color: '#58C71B' }} />
        <Box sx={{ width: '100%' }}>
          <LinearProgress
            sx={{
              height: 4,
              borderRadius: 999,
              bgcolor: 'rgba(88, 199, 27, 0.12)',
              '& .MuiLinearProgress-bar': { bgcolor: '#58C71B' },
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    </div>
  );
}
