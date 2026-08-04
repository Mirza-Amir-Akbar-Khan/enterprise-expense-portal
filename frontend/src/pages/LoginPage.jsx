import { useState } from 'react';
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
          // Invited user logged in with temporary password $\rightarrow$ switch to Step 2
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
    <div className="login-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(7, 10, 19, 0.82)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div className="login-card" style={{
        backgroundColor: 'rgba(17, 24, 39, 0.92)',
        borderRadius: '16px',
        padding: '2.5rem',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
      }}>
        {/* Close X Button */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0.25rem',
              borderRadius: '6px',
              transition: 'color 0.15s ease',
            }}
            title="Close"
          >
            ✕
          </button>
        )}

        <div className="login-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="login-logo-badge" style={{
            display: 'inline-block',
            padding: '0.4rem 1rem',
            background: challengeState
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
            color: challengeState ? '#fbbf24' : '#a5b4fc',
            border: challengeState ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.85rem',
            letterSpacing: '0.025em',
          }}>
            {challengeState ? '🔑 Password Setup Required' : '🔐 Enterprise Authentication'}
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem 0', letterSpacing: '-0.025em' }}>
            {challengeState ? 'Set Permanent Password' : 'Sign In to Portal'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
            {challengeState
              ? 'First time logging in? Choose a new permanent password.'
              : 'Authenticate with your Cognito corporate credentials'}
          </p>
        </div>

        {error && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '0.85rem 1.1rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '0.875rem',
            lineHeight: '1.4',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {challengeState ? (
            /* STEP 2: First-Time Permanent Password Setup */
            <>
              <div style={{ marginBottom: '1.35rem' }}>
                <label htmlFor="new-password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#cbd5e1' }}>
                  New Permanent Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.85rem 3rem 0.85rem 1.1rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: '#f8fafc',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      opacity: 0.7,
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label htmlFor="confirm-password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#cbd5e1' }}>
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </>
          ) : (
            /* STEP 1: Standard Email & Password Login */
            <>
              <div style={{ marginBottom: '1.35rem' }}>
                <label htmlFor="login-email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#cbd5e1' }}>
                  Work Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="user@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.1rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#f8fafc',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label htmlFor="login-password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: '#cbd5e1' }}>
                  Password (or Temporary Password)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.85rem 3rem 0.85rem 1.1rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: '#f8fafc',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      opacity: 0.7,
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.85rem' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.85rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '0.85rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              }}
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
