import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

const TAB_BADGE_COLORS = {
  All: { bg: '#212B36', color: '#fff' },
  Upcoming: { bg: '#FFF5CC', color: '#B76E00' },
  'On-Going': { bg: '#CAFDF5', color: '#006C9C' },
  Completed: { bg: '#D3FCD2', color: '#118D57' },
  Cancelled: { bg: '#FFE9D5', color: '#B71D18' },
  Refunded: { bg: '#F4F6F8', color: '#637381' },
  Ongoing: { bg: '#CAFDF5', color: '#006C9C' },
  Past: { bg: '#F4F6F8', color: '#637381' },
  default: { bg: '#F4F6F8', color: '#637381' },
};

function TabLabel({ label, count }) {
  const badge = TAB_BADGE_COLORS[label] || TAB_BADGE_COLORS.default;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {label}
      {count != null && (
        <Box
          component="span"
          sx={{
            px: 0.75,
            py: 0.125,
            borderRadius: 1,
            fontSize: '0.7rem',
            fontWeight: 700,
            bgcolor: badge.bg,
            color: badge.color,
            minWidth: 20,
            textAlign: 'center',
          }}
        >
          {count}
        </Box>
      )}
    </Box>
  );
}

export default function TableTabs({ tabs, value, onChange, sx }) {
  return (
    <Tabs
      value={value}
      onChange={(_e, v) => onChange(v)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        px: 2,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        '& .MuiTabs-flexContainer': { gap: 2 },
        ...sx,
      }}
    >
      {tabs.map((tab) => (
        <Tab
          key={tab.value}
          value={tab.value}
          label={<TabLabel label={tab.label} count={tab.count} />}
          disableRipple
        />
      ))}
    </Tabs>
  );
}
