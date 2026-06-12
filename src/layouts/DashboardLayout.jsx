import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { logoutUser } from '../lib/auth';
import {
  Box,
  Collapse,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme,
  Badge,
  Button,
} from '@mui/material';
import Logo from '../components/logo/Logo';
import { useAppData } from '../context/AppDataContext';
import { canAccessRoute, getFinanceNavItems, getRoleLabel } from '../utils/accessControl';

const SIDEBAR_WIDTH = 272;

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'ri-dashboard-3-line' },
  { path: '/bookings', label: 'Bookings', icon: 'ri-calendar-check-line', badgeKey: 'bookings' },
  { path: '/packages', label: 'Packages', icon: 'ri-map-2-line', badgeKey: 'packages' },
  { path: '/schedule', label: 'Schedule', icon: 'ri-time-line' },
  {
    path: '/finance',
    label: 'Finance',
    icon: 'ri-money-dollar-circle-line',
    financeMenu: true,
  },
  { path: '/users', label: 'Users', icon: 'ri-group-line' },
];

function SidebarContent({ onClose, onSignOut }) {
  const { userProfile, scopedBookings, packages } = useAppData();
  const location = useLocation();
  const financeNavItems = getFinanceNavItems(userProfile);
  const financeActive = location.pathname.startsWith('/finance');
  const [financeOpen, setFinanceOpen] = useState(financeActive);

  const badges = { bookings: scopedBookings.length, packages: packages.length };
  const initial = userProfile?.fullName?.trim()?.[0]?.toUpperCase() || 'U';
  const roleLabel = getRoleLabel(userProfile?.role);
  const visibleNavItems = navItems.filter((item) => {
    if (item.financeMenu) return financeNavItems.length > 0;
    return canAccessRoute(item.path, userProfile);
  });

  function isNavActive(item, childPath) {
    if (childPath) {
      if (childPath === '/finance') {
        return location.pathname === '/finance' || location.pathname === '/finance/';
      }
      return location.pathname === childPath;
    }
    return location.pathname.startsWith(item.path);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Box sx={{ px: 1, py: 2, mb: 1 }}>
        <Logo />
      </Box>
      <Divider sx={{ mb: 2 }} />

      <List disablePadding sx={{ flex: 1 }}>
        {visibleNavItems.map((item) => {
          if (item.financeMenu) {
            return (
              <Box key={item.path}>
                <ListItemButton
                  selected={financeActive}
                  onClick={() => setFinanceOpen((open) => !open)}
                  sx={{
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'action.hover',
                      borderLeft: '3px solid',
                      borderColor: 'primary.main',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <i
                      className={item.icon}
                      style={{ fontSize: 20, color: financeActive ? '#58C71B' : '#637381' }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: financeActive ? 700 : 500,
                      fontSize: '0.9rem',
                    }}
                  />
                  <i
                    className={financeOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
                    style={{ fontSize: 16, color: '#637381' }}
                  />
                </ListItemButton>
                <Collapse in={financeOpen} timeout="auto" unmountOnExit>
                  <List disablePadding sx={{ pl: 2, mb: 0.5 }}>
                    {financeNavItems.map((child) => {
                      const childActive = isNavActive(item, child.path);
                      return (
                        <ListItemButton
                          key={child.path}
                          component={NavLink}
                          to={child.path}
                          selected={childActive}
                          onClick={onClose}
                          sx={{
                            py: 0.75,
                            '&.Mui-selected': {
                              bgcolor: 'action.hover',
                              borderLeft: '3px solid',
                              borderColor: 'primary.main',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <i
                              className={child.icon}
                              style={{ fontSize: 18, color: childActive ? '#58C71B' : '#637381' }}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={child.label}
                            primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: childActive ? 700 : 500 }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          }

          const active = location.pathname.startsWith(item.path);
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

          return (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              selected={active}
              onClick={onClose}
              sx={{
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'action.hover',
                  borderLeft: '3px solid',
                  borderColor: 'primary.main',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <i
                  className={item.icon}
                  style={{ fontSize: 20, color: active ? '#58C71B' : '#637381' }}
                />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.9rem',
                }}
              />
              {badgeCount > 0 && (
                <Badge badgeContent={badgeCount} color="primary" sx={{ mr: 1 }} />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, pb: 1 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'grey.800', fontSize: 14 }}>
          {initial}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>{userProfile?.fullName || 'User'}</Typography>
          <Typography variant="caption" color="text.secondary">{roleLabel}</Typography>
        </Box>
      </Box>
      <Button variant="outlined" size="small" onClick={onSignOut} sx={{ mt: 1, mx: 1 }}>
        Sign out
      </Button>
    </Box>
  );
}

export default function DashboardLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { bookings, packages, userProfile } = useAppData();

  const pageMeta = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/bookings')) {
      if (path.includes('/edit')) return { title: 'Edit booking', subtitle: 'Update reservation details' };
      if (path.includes('/new')) return { title: 'New booking', subtitle: 'Create a reservation' };
      if (path.match(/\/bookings\/[^/]+$/)) return { title: 'Booking details', subtitle: 'Order summary' };
      return { title: 'Bookings', subtitle: `${bookings.length} total bookings` };
    }
    if (path.startsWith('/packages')) return { title: 'Packages', subtitle: `${packages.length} tour packages` };
    if (path.startsWith('/schedule')) return { title: 'Schedule', subtitle: 'Trip batches overview' };
    if (path.startsWith('/finance/zohaib')) {
      return { title: 'Zohaib pool', subtitle: 'Pool payouts and bookings' };
    }
    if (path.startsWith('/finance/pervaiz')) {
      return { title: 'Pervaiz pool', subtitle: 'Pool payouts and bookings' };
    }
    if (path.startsWith('/finance')) return { title: 'Finance', subtitle: 'Revenue and partner shares' };
    return { title: 'Dashboard', subtitle: `Welcome back, ${userProfile?.fullName?.split(' ')[0] || 'there'}` };
  }, [location.pathname, bookings.length, packages.length, userProfile?.fullName]);

  async function handleSignOut() {
    await logoutUser();
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {!isMobile && (
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 100,
          }}
        >
          <SidebarContent onSignOut={handleSignOut} />
        </Box>
      )}

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH } }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} onSignOut={handleSignOut} />
      </Drawer>

      <Box
        sx={{
          flexGrow: 1,
          ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <AppBar position="sticky" elevation={0}>
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)}>
                <i className="ri-menu-line" style={{ fontSize: 22 }} />
              </IconButton>
            )}
            {isMobile ? (
              <Logo sx={{ flex: 1 }} />
            ) : (
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>{pageMeta.title}</Typography>
                {pageMeta.subtitle && (
                  <Typography variant="body2" color="text.secondary">{pageMeta.subtitle}</Typography>
                )}
              </Box>
            )}
            <IconButton>
              <i className="ri-notification-3-line" style={{ fontSize: 20, color: '#637381' }} />
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: { xs: 2, md: 3 }, flex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}
