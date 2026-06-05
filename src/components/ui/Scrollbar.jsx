import Box from '@mui/material/Box';

export default function Scrollbar({ children, sx, ...other }) {
  return (
    <Box
      sx={{
        overflow: 'auto',
        '&::-webkit-scrollbar': { width: 6, height: 6 },
        '&::-webkit-scrollbar-thumb': {
          borderRadius: 3,
          bgcolor: 'grey.400',
        },
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}
