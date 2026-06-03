import { useState } from 'react';
import {
  Box,
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

const SIDEBAR_WIDTH = 272;

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-3-line' },
  {
    key: 'bookings',
    label: 'Bookings',
    icon: 'ri-calendar-check-line',
    badgeKey: 'bookings',
  },
  {
    key: 'packages',
    label: 'Packages',
    icon: 'ri-map-2-line',
    badgeKey: 'packages',
  },
  { key: 'schedule', label: 'Schedule', icon: 'ri-time-line' },
  {
    key: 'revenue',
    label: 'Finance',
    icon: 'ri-money-dollar-circle-line',
  },
];

function SidebarContent({
  screen,
  setScreen,
  onClose,
  currentUserName,
  currentUserEmail,
  userRole,
  bookingCount,
  packageCount,
  onSignOut,
}) {
  const badges = {
    bookings: bookingCount,
    packages: packageCount,
  };

  const initial = currentUserName?.trim()?.[0]?.toUpperCase() || 'U';
  const roleLabel = userRole === 'viewer' ? 'Read-only' : 'Admin';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Box sx={{ px: 1, py: 2, mb: 1 }}>
        <Logo />
      </Box>
      <Divider sx={{ mb: 2, borderColor: '#E8F5E0' }} />

      <List disablePadding sx={{ flex: 1 }}>
        {navItems.map((item) => {
          const active = screen === item.key;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

          return (
            <ListItemButton
              key={item.key}
              selected={active}
              onClick={() => {
                setScreen(item.key);
                onClose?.();
              }}
              sx={{ mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <i
                  className={item.icon}
                  style={{
                    fontSize: 20,
                    color: active ? '#409F11' : '#637381',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.9rem',
                  color: active ? '#409F11' : '#101828',
                }}
              />
              {badgeCount > 0 && (
                <Badge
                  badgeContent={badgeCount}
                  color="primary"
                  sx={{ mr: active ? 1 : 0 }}
                />
              )}
              {active && (
                <Box
                  sx={{
                    width: 4,
                    height: 32,
                    borderRadius: 4,
                    backgroundColor: '#58C71B',
                    ml: 1,
                  }}
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#E8F5E0', mb: 2 }} />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1,
          pb: 1,
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: '#58C71B',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {initial}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: '#101828', lineHeight: 1.2 }}
            noWrap
          >
            {currentUserName || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#637381' }} noWrap>
            {roleLabel}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#637381', display: 'block' }}
            noWrap
          >
            {currentUserEmail || '-'}
          </Typography>
        </Box>
      </Box>

      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={onSignOut}
        sx={{ mt: 1, mx: 1 }}
      >
        Sign out
      </Button>
    </Box>
  );
}

export default function DashboardLayout({
  children,
  screen,
  setScreen,
  pageTitle,
  pageSubtitle,
  currentUserName,
  currentUserEmail,
  userRole,
  bookingCount = 0,
  packageCount = 0,
  onSignOut,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarProps = {
    screen,
    setScreen,
    currentUserName,
    currentUserEmail,
    userRole,
    bookingCount,
    packageCount,
    onSignOut,
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F6FBF3' }}>
      {!isMobile && (
        <Box
          sx={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            borderRight: '1px solid #E8F5E0',
            bgcolor: '#FFFFFF',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 100,
          }}
        >
          <SidebarContent {...sidebarProps} />
        </Box>
      )}

      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH } }}
      >
        <SidebarContent
          {...sidebarProps}
          onClose={() => setMobileOpen(false)}
        />
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
              <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 0.5 }}>
                <i
                  className="ri-menu-line"
                  style={{ fontSize: 22, color: '#101828' }}
                />
              </IconButton>
            )}
            {isMobile ? (
              <Logo sx={{ flex: 1 }} />
            ) : (
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {pageTitle}
                </Typography>
                {pageSubtitle && (
                  <Typography variant="body2" sx={{ color: '#637381' }}>
                    {pageSubtitle}
                  </Typography>
                )}
              </Box>
            )}
            <Box sx={{ flex: isMobile ? 0 : undefined }} />
            <IconButton>
              <i
                className="ri-notification-3-line"
                style={{ fontSize: 20, color: '#637381' }}
              />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: { xs: 2, md: 3 }, flex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}
