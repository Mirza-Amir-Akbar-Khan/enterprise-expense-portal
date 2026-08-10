function Navbar({ activePage, setActivePage, currentUserRole, user, isAuthenticated, onOpenLogin, onSignOut }) {
  return (
    <header className="navbar">
      <div 
        className="navbar-brand" 
        onClick={() => setActivePage('home')} 
        style={{ cursor: 'pointer' }}
      >
        Enterprise Expense & Claim Portal
      </div>
      <nav className="navbar-links">
        {isAuthenticated ? (
          /* When logged in: show tabs relevant to the user's role */
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
              <button className="nav-link active" style={{ color: '#fbbf24' }}>
                Account Pending Approval
              </button>
            )}
          </>
        ) : (
          /* When NOT logged in: only show Home */
          <button 
            className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => setActivePage('home')}
          >
            Home
          </button>
        )}
      </nav>

      {/* Auth Controls */}
      <div className="navbar-user">
        {isAuthenticated ? (
          <div className="user-profile-badge">
            <span className="user-email-text" title={user?.email}>
              👤 {user?.email || user?.name || 'Authenticated User'}
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
