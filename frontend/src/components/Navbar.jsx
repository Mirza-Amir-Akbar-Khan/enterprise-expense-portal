import { useEffect, useState } from 'react';

function Navbar({ activePage, setActivePage, currentUserRole, user, isAuthenticated, onOpenLogin, onSignOut }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 
             document.documentElement.getAttribute('data-theme') || 
             'light';
    }
    return 'light';
  });

  // Apply theme on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initialize Lucide icons after render
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="navbar">
      <div 
        className="navbar-brand" 
        onClick={() => setActivePage('home')} 
      >
        Enterprise Expense & Claim Portal
      </div>
      <nav className="navbar-links">
        {isAuthenticated && (
          <>
            {currentUserRole === 'EMPLOYEE' && (
              <button className="nav-link active">
                My Claims
              </button>
            )}
            {currentUserRole === 'MANAGER' && (
              <>
                <button
                  className={`nav-link ${activePage === 'employee' ? 'active' : ''}`}
                  onClick={() => setActivePage('employee')}
                >
                  My Claims
                </button>
                <button
                  className={`nav-link ${activePage === 'manager' ? 'active' : ''}`}
                  onClick={() => setActivePage('manager')}
                >
                  Manager Portal
                </button>
              </>
            )}
            {currentUserRole === 'ADMIN' && (
              <button className="nav-link active">
                Admin Portal
              </button>
            )}
            {currentUserRole === 'PENDING' && (
              <button className="nav-link active" style={{ color: 'var(--status-pending-text)' }}>
                Account Pending Approval
              </button>
            )}
          </>
        )}
      </nav>

      {/* Theme Toggle + Auth Controls */}
      <div className="navbar-user">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <i data-lucide={theme === 'dark' ? 'sun' : 'moon'} style={{ width: 16, height: 16 }}></i>
        </button>

        {isAuthenticated ? (
          <div className="user-profile-badge">
            <span className="user-email-text" title={user?.email}>
              <i data-lucide="user" style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }}></i>
              {user?.email || user?.name || 'Authenticated User'}
            </span>
            <button className="btn btn-outline sign-out-btn" onClick={onSignOut}>
              Sign Out
            </button>
          </div>
        ) : (
          <button className="btn btn-primary sign-in-btn" onClick={onOpenLogin}>
            Sign In to Portal
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
