function Sidebar({
  screen,
  setScreen,
  onResetLocalData,
  bookingCount,
  packageCount,
  currentUserName,
  currentUserEmail,
  userRole = 'admin',
  onSignOut,
}) {
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: '▦' },
    { key: 'bookings', label: 'Bookings', icon: '☷', badge: bookingCount },
    { key: 'packages', label: 'Packages', icon: '◫', badge: packageCount },
    { key: 'schedule', label: 'Schedule', icon: '🗓' },
  ];

  const initial = currentUserName?.trim()?.[0]?.toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" />
          <span>Pakrism</span>
        </div>
        <div className="sidebar-brand-subtitle">Booking Manager</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            className={
              screen === item.key ? 'sidebar-link active' : 'sidebar-link'
            }
            onClick={() => setScreen(item.key)}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
            {typeof item.badge === 'number' && item.badge > 0 && (
              <span className="sidebar-badge">{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initial}</div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">{currentUserName || 'User'}</div>
            <div className="sidebar-user-email">{currentUserEmail || '-'}</div>
            {userRole === 'viewer' && (
              <div className="sidebar-role-badge">Read-only</div>
            )}
          </div>
        </div>

        <div className="sidebar-footer-actions">
          <button
            className="sidebar-ghost-btn"
            type="button"
            onClick={onSignOut}
          >
            Sign out
          </button>
          <button
            className="sidebar-danger-btn"
            type="button"
            onClick={onResetLocalData}
          >
            Reset Local Data
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
