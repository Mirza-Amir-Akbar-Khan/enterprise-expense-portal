import { useState, useEffect } from 'react';

function PendingPage({ userEmail, onRefreshStatus, onSignOut }) {
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState('');

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const handleRefresh = async () => {
    setChecking(true);
    setCheckMessage('');
    if (onRefreshStatus) {
      const updatedUser = await onRefreshStatus();
      if (updatedUser && updatedUser.role !== 'PENDING') {
        setCheckMessage(`Status updated! Your role is now ${updatedUser.role}.`);
      } else {
        setCheckMessage('Your account status is still pending approval by an administrator.');
      }
    }
    setChecking(false);
  };

  return (
    <div className="pending-container fade-in">
      <div className="card pending-card">
        <div className="pending-icon-wrapper">
          <div className="pending-pulse-ring"></div>
          <span className="pending-icon">
            <i data-lucide="clock" style={{ width: 28, height: 28, color: 'var(--status-pending-text)' }}></i>
          </span>
        </div>

        <h1 className="pending-title">Account Approval Pending</h1>
        
        <p className="pending-subtitle">
          Welcome <strong style={{ color: 'var(--text-main)' }}>{userEmail || 'User'}</strong>! Your account has been registered successfully.
        </p>

        <div className="pending-alert-box">
          <p>
            <i data-lucide="lock" style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }}></i>
            <strong>Role Assignment Required</strong>: Your status is currently <strong>PENDING</strong>. An administrator must confirm your account and assign your role (Employee or Manager) before you can access portal features.
          </p>
        </div>

        {checkMessage && (
          <div className="alert-banner info" style={{ marginBottom: '16px' }}>
            {checkMessage}
          </div>
        )}

        <div className="pending-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleRefresh}
            disabled={checking}
          >
            <i data-lucide="refresh-cw" style={{ width: 14, height: 14 }}></i>
            {checking ? 'Checking...' : 'Refresh Status'}
          </button>
          
          <button 
            className="btn btn-outline" 
            onClick={onSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default PendingPage;
