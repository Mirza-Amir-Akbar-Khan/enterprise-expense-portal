import { CognitoJwtVerifier } from 'aws-jwt-verify';

let idTokenVerifier = null;
let accessTokenVerifier = null;

function getVerifiers() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.COGNITO_CLIENT_ID;

  if (!idTokenVerifier && userPoolId && clientId) {
    idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId,
      clientId,
      tokenUse: 'id',
    });
  }

  if (!accessTokenVerifier && userPoolId && clientId) {
    accessTokenVerifier = CognitoJwtVerifier.create({
      userPoolId,
      clientId,
      tokenUse: 'access',
    });
  }

  return { idTokenVerifier, accessTokenVerifier };
}

async function verifyJwtString(token) {
  const { idTokenVerifier, accessTokenVerifier } = getVerifiers();

  if (!idTokenVerifier && !accessTokenVerifier) {
    throw new Error('Server configuration error: AWS Cognito parameters missing.');
  }

  // Attempt verification as ID Token first (contains email & profile claims)
  try {
    if (idTokenVerifier) {
      return await idTokenVerifier.verify(token);
    }
  } catch (idErr) {
    // Fallback: verify as Access Token
    if (accessTokenVerifier) {
      return await accessTokenVerifier.verify(token);
    } else {
      throw idErr;
    }
  }
}

/**
 * Express Middleware to strictly verify AWS Cognito JWT Tokens (Bearer header required)
 */
export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authorization token missing or malformed.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyJwtString(token);
    req.user = payload;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
}

/**
 * Express Middleware to optionally verify AWS Cognito JWT Tokens (allows unauthenticated access if no header)
 */
export async function optionalVerifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = await verifyJwtString(token);
    req.user = payload;
    next();
  } catch (error) {
    console.warn('Optional JWT Verification failed:', error.message);
    req.user = null;
    next();
  }
}
