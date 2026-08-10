function HomePage({ isAuthenticated, user, onOpenLogin }) {
  return (
    <div className="page-home fade-in">
      <section className="hero-section">
        <h1>Seamless Expense & Claim Management for Enterprise</h1>
        <p className="hero-subtitle">
          Streamline your workflow with instant submissions, itemized line breakdowns, and automated approval tracking powered by AWS Cognito.
        </p>

        {isAuthenticated ? (
          <div className="welcome-banner">
            <p className="user-welcome-msg">
              Welcome back, <strong>{user?.email || user?.name || 'Authenticated User'}</strong>!
            </p>
            <p className="hero-subtitle" style={{ marginTop: '0.5rem', opacity: 0.7 }}>
              Redirecting you to your portal…
            </p>
          </div>
        ) : (
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={onOpenLogin}>
              Sign In to Portal
            </button>
          </div>
        )}
      </section>
      
      <section className="features-section">
        <div className="feature-card card">
          <div className="feature-icon">🔒</div>
          <h3>Secure Authentication</h3>
          <p>Protected with enterprise-grade AWS Cognito API and JWT validation.</p>
        </div>
        <div className="feature-card card">
          <div className="feature-icon">📑</div>
          <h3>Itemized Line Items</h3>
          <p>Add sub-items for tickets, meals, hotels, and receipts under a single claim header.</p>
        </div>
        <div className="feature-card card">
          <div className="feature-icon">⚡</div>
          <h3>Automated Approval Workflows</h3>
          <p>Route claims directly to managers for transparent item-by-item review and approval.</p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
