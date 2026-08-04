import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-west-2_ftvJMmaEZ',
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '5qld78ha5jqehpints073kbudv',
};

// Fallback to extract pool ID from VITE_COGNITO_AUTHORITY if set
if (import.meta.env.VITE_COGNITO_AUTHORITY && !import.meta.env.VITE_COGNITO_USER_POOL_ID) {
  const parts = import.meta.env.VITE_COGNITO_AUTHORITY.split('/');
  const poolIdFromAuth = parts[parts.length - 1];
  if (poolIdFromAuth) {
    poolData.UserPoolId = poolIdFromAuth;
  }
}

const userPool = new CognitoUserPool(poolData);

/**
 * Authenticate email/password against AWS Cognito User Pool via API
 */
export const loginWithCognito = (email, password) => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();
        const refreshToken = result.getRefreshToken() ? result.getRefreshToken().getToken() : null;
        const payload = result.getIdToken().decodePayload();

        const user = {
          email: payload.email || email,
          sub: payload.sub,
          name: payload.name || payload.given_name || email.split('@')[0],
          idToken,
          accessToken,
          refreshToken,
          profile: payload,
        };

        setStoredUser(user);
        resolve(user);
      },
      onFailure: (err) => {
        console.error('Cognito API Login Failure:', err);
        reject(err);
      },
      newPasswordRequired: (userAttributes) => {
        // Remove non-writable attributes before completing challenge
        delete userAttributes.email_verified;
        delete userAttributes.email;
        resolve({
          newPasswordRequired: true,
          cognitoUser,
          userAttributes,
        });
      },
    });
  });
};

/**
 * Complete NEW_PASSWORD_REQUIRED challenge for invited users on first login
 */
export const completeNewPasswordChallenge = (cognitoUser, newPassword, userAttributes = {}) => {
  return new Promise((resolve, reject) => {
    cognitoUser.completeNewPasswordChallenge(newPassword, userAttributes, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();
        const refreshToken = result.getRefreshToken() ? result.getRefreshToken().getToken() : null;
        const payload = result.getIdToken().decodePayload();

        const user = {
          email: payload.email || cognitoUser.getUsername(),
          sub: payload.sub,
          name: payload.name || payload.given_name || cognitoUser.getUsername().split('@')[0],
          idToken,
          accessToken,
          refreshToken,
          profile: payload,
        };

        setStoredUser(user);
        resolve(user);
      },
      onFailure: (err) => {
        console.error('Complete New Password Challenge Failure:', err);
        reject(err);
      },
    });
  });
};

/**
 * Sign out user locally and clear active session
 */
export const logoutCognito = () => {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  localStorage.removeItem('cognito_auth_user');
};

/**
 * Get active user stored in localStorage
 */
export const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('cognito_auth_user');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error parsing stored user:', e);
  }
  return null;
};

/**
 * Persist user data in localStorage
 */
export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('cognito_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('cognito_auth_user');
  }
};
