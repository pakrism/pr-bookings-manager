import ApexChart from 'react-apexcharts';
import Box from '@mui/material/Box';

export default function Chart({
  type = 'line',
  series = [],
  options = {},
  height = 320,
  width = '100%',
  sx,
  ...other
}) {
  return (
    <Box sx={{ width, height, ...sx }} {...other}>
      <ApexChart type={type} series={series} options={options} height={height} width="100%" />
    </Box>
  );
}
