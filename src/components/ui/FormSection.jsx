import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

export default function FormSection({
  title,
  subtitle,
  children,
  defaultExpanded = true,
  action,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card sx={{ mb: 3, overflow: 'visible' }}>
      <Box
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <Box>
          <Typography variant="h6">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {action}
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}>
            <i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
          </IconButton>
        </Box>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ px: 3, pb: 3 }}>{children}</Box>
      </Collapse>
    </Card>
  );
}
