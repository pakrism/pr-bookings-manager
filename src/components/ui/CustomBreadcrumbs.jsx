import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';

export default function CustomBreadcrumbs({ links = [], sx }) {
  if (!links.length) return null;

  return (
    <Breadcrumbs
      separator="•"
      sx={{ mb: 2, ...sx }}
      aria-label="breadcrumb"
    >
      {links.map((link, index) => {
        const isLast = index === links.length - 1;

        if (isLast || !link.href) {
          return (
            <Typography
              key={link.name}
              variant="body2"
              color={isLast ? 'text.primary' : 'text.secondary'}
              fontWeight={isLast ? 600 : 400}
            >
              {link.name}
            </Typography>
          );
        }

        return (
          <Link
            key={link.name}
            component={RouterLink}
            to={link.href}
            underline="hover"
            color="inherit"
            variant="body2"
          >
            {link.name}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
