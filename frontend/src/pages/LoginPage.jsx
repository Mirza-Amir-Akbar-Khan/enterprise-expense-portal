import { useState, useEffect } from 'react';
import { loginWithCognito, completeNewPasswordChallenge } from '../services/authService';

function LoginPage({ onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for NEW_PASSWORD_REQUIRED challenge (invited user first login)
  const [challengeState, setChallengeState] = useState(null); // null | { cognitoUser, userAttributes }
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (challengeState) {
      // Step 2: Handle First-Time Permanent Password Setup
      if (!newPassword || !confirmPassword) {
        setError('Please fill in both password fields.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      try {
        setLoading(true);
        const user = await completeNewPasswordChallenge(
          challengeState.cognitoUser,
          newPassword,
          challengeState.userAttributes
        );
        if (onLoginSuccess) {
          onLoginSuccess(user);
        }
      } catch (err) {
        setError(err.message || 'Failed to update password. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Step 1: Initial Login
      if (!email || !password) {
        setError('Please enter both email and password.');
        return;
      }

      try {
        setLoading(true);
        const result = await loginWithCognito(email, password);

        if (result && result.newPasswordRequired) {
          // Invited user logged in with temporary password → switch to Step 2
          setChallengeState({
            cognitoUser: result.cognitoUser,
            userAttributes: result.userAttributes,
          });
        } else if (onLoginSuccess) {
          onLoginSuccess(result);
        }
      } catch (err) {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-card">
        {/* Close X Button */}
        {onCancel && (
          <button
            type="button"
            className="login-close-btn"
            onClick={onCancel}
            title="Close"
          >
            <i data-lucide="x" style={{ width: 18, height: 18 }}></i>
          </button>
        )}

        <div className="login-header">
          <div className={`login-logo-badge ${challengeState ? 'login-logo-badge--challenge' : 'login-logo-badge--default'}`}>
            <i data-lucide={challengeState ? 'key-round' : 'lock'} style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }}></i>
            {challengeState ? 'Password Setup Required' : 'Enterprise Authentication'}
          </div>
          <h2 className="login-title">
            {challengeState ? 'Set Permanent Password' : 'Sign In to Portal'}
          </h2>
          <p className="login-subtitle">
            {challengeState
              ? 'First time logging in? Choose a new permanent password.'
              : 'Authenticate with your Cognito corporate credentials'}
          </p>
        </div>

        {error && (
          <div className="login-error">
            <i data-lucide="alert-triangle" style={{ width: 14, height: 14, display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }}></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {challengeState ? (
            /* STEP 2: First-Time Permanent Password Setup */
            <>
              <div className="login-form-group">
                <label htmlFor="new-password" className="login-label">
                  New Permanent Password
                </label>
                <div className="login-input-wrapper">
                  <input
                    id="new-password"
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i data-lucide={showPassword ? 'eye-off' : 'eye'} style={{ width: 16, height: 16 }}></i>
                  </button>
                </div>
              </div>

              <div className="login-form-group">
                <label htmlFor="confirm-password" className="login-label">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </>
          ) : (
            /* STEP 1: Standard Email & Password Login */
            <>
              <div className="login-form-group">
                <label htmlFor="login-email" className="login-label">
                  Work Email Address
                </label>
                <input
                  id="login-email"
                  className="login-input"
                  type="email"
                  placeholder="user@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="login-form-group">
                <label htmlFor="login-password" className="login-label">
                  Password (or Temporary Password)
                </label>
                <div className="login-input-wrapper">
                  <input
                    id="login-password"
                    className="login-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    className="login-toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i data-lucide={showPassword ? 'eye-off' : 'eye'} style={{ width: 16, height: 16 }}></i>
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="login-actions">
            {onCancel && (
              <button
                type="button"
                className="login-btn-cancel"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="login-btn-submit"
              disabled={loading}
            >
              {loading
                ? 'Processing...'
                : challengeState
                ? 'Save Password & Sign In'
                : 'Sign In with Cognito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
