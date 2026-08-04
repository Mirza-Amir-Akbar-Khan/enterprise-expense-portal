function Navbar({ activePage, setActivePage, currentUserRole, user, isAuthenticated, onOpenLogin, onSignOut }) {
  return (
    <header className="navbar">
      <div 
        className="navbar-brand" 
        onClick={() => {
          if (!isAuthenticated) setActivePage('home');
        }} 
        style={{ cursor: !isAuthenticated ? 'pointer' : 'default' }}
      >
        Enterprise Expense & Claim Portal
      </div>
      <nav className="navbar-links">
        {isAuthenticated ? (
          /* When logged in: restrict navigation strictly to user's assigned role screen */
          <>
            {currentUserRole === 'EMPLOYEE' && (
              <button className="nav-link active">
                Employee Portal
              </button>
            )}
            {currentUserRole === 'MANAGER' && (
              <button className="nav-link active">
                Manager Portal
              </button>
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
          /* When NOT logged in: preview mode allows inspecting all screens */
          <>
            <button 
              className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
              onClick={() => setActivePage('home')}
            >
              Home
            </button>
            <button 
              className={`nav-link ${activePage === 'employee' ? 'active' : ''}`}
              onClick={() => setActivePage('employee')}
            >
              Employee Portal
            </button>
            <button 
              className={`nav-link ${activePage === 'manager' ? 'active' : ''}`}
              onClick={() => setActivePage('manager')}
            >
              Manager Portal
            </button>
            <button 
              className={`nav-link ${activePage === 'admin' ? 'active' : ''}`}
              onClick={() => setActivePage('admin')}
            >
              Admin Portal
            </button>
          </>
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
            Sign In with Cognito
          </button>
        )}
      </div>
    </header>
  );
}

export default Navbar;
