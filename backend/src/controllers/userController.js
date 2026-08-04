import pool from '../config/db.js';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

// Get all users with role name and manager details
export async function getAllUsers(req, res) {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.cognito_sub, u.name, u.email, u.role_id, r.name AS role, 
              u.manager_id, m.name AS manager_name, m.email AS manager_email, u.created_at
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       LEFT JOIN users m ON u.manager_id = m.id
       ORDER BY u.id ASC`
    );
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Sync user logging in via AWS Cognito (Admin provision required)
export async function syncUser(req, res) {
  const verifiedSub = req.user?.sub;
  const verifiedEmail = req.user?.email;
  const verifiedName = req.user?.name || req.user?.given_name;

  const email = verifiedEmail || req.body.email;
  const userSub = verifiedSub || req.body.cognitoSub;
  const userName = verifiedName || req.body.name || (email ? email.split('@')[0] : 'User');

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    // Check if user exists by cognito_sub or email
    const [existing] = await pool.query(
      `SELECT u.id, u.cognito_sub, u.name, u.email, u.role_id, r.name AS role, u.manager_id, m.name AS manager_name
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       LEFT JOIN users m ON u.manager_id = m.id
       WHERE u.cognito_sub = ? OR u.email = ? LIMIT 1`,
      [userSub, email]
    );

    if (existing.length > 0) {
      const user = existing[0];
      await pool.query(
        'UPDATE users SET cognito_sub = ?, name = ? WHERE id = ?',
        [userSub, userName, user.id]
      );
      return res.json({
        success: true,
        message: 'User synced successfully',
        user: { ...user, cognito_sub: userSub, name: userName },
      });
    }

    // Strict Mode: Unprovisioned users are not allowed access
    return res.status(403).json({
      success: false,
      message: 'Access denied. Account has not been provisioned by an administrator.',
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Admin: Create & Invite User via AWS Cognito and Provision in MySQL Database
export async function adminCreateUser(req, res) {
  const { email, name, role, roleId, managerId } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const userName = name || email.split('@')[0];

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'User with this email already exists in database' });
    }

    // Determine role_id
    let finalRoleId = roleId ? Number(roleId) : null;
    if (!finalRoleId && role) {
      const [roles] = await pool.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [role]);
      if (roles.length > 0) finalRoleId = roles[0].id;
    }
    if (!finalRoleId) {
      const [defaultRole] = await pool.query('SELECT id FROM roles WHERE name = "EMPLOYEE" LIMIT 1');
      finalRoleId = defaultRole.length > 0 ? defaultRole[0].id : 2;
    }

    const finalManagerId = (managerId && managerId !== '' && managerId !== 'null') ? Number(managerId) : null;

    // 1. Invoke AWS Cognito AdminCreateUser API to invite user via Email
    const region = process.env.AWS_REGION || process.env.COGNITO_REGION || 'us-west-2';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    const cognitoClient = new CognitoIdentityProviderClient({
      region,
      credentials: (accessKeyId && secretAccessKey) ? { accessKeyId, secretAccessKey } : undefined,
    });

    let cognitoSub = `manual-sub-${Date.now()}`;

    try {
      const createCommand = new AdminCreateUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: userName },
        ],
        DesiredDeliveryMediums: ['EMAIL'],
      });

      const cognitoRes = await cognitoClient.send(createCommand);
      if (cognitoRes.User && cognitoRes.User.Attributes) {
        const subAttr = cognitoRes.User.Attributes.find(a => a.Name === 'sub');
        if (subAttr) cognitoSub = subAttr.Value;
      }
    } catch (cognitoErr) {
      console.warn('AWS Cognito AdminCreateUser Warning:', cognitoErr.message);
      if (cognitoErr.name === 'UsernameExistsException') {
        // User already exists in Cognito Pool, continue DB provision
      } else {
        return res.status(400).json({
          success: false,
          message: `Failed to create user in AWS Cognito: ${cognitoErr.message}`,
        });
      }
    }

    // 2. Insert User into MySQL Database
    const [result] = await pool.query(
      'INSERT INTO users (cognito_sub, name, email, role_id, manager_id) VALUES (?, ?, ?, ?, ?)',
      [cognitoSub, userName, email, finalRoleId, finalManagerId]
    );

    const [roleInfo] = await pool.query('SELECT name FROM roles WHERE id = ?', [finalRoleId]);
    const roleName = roleInfo.length > 0 ? roleInfo[0].name : 'EMPLOYEE';

    let managerName = null;
    if (finalManagerId) {
      const [mgrInfo] = await pool.query('SELECT name FROM users WHERE id = ?', [finalManagerId]);
      if (mgrInfo.length > 0) managerName = mgrInfo[0].name;
    }

    res.status(201).json({
      success: true,
      message: `User created successfully! Invitation email dispatched to ${email}.`,
      user: {
        id: result.insertId,
        cognito_sub: cognitoSub,
        name: userName,
        email,
        role_id: finalRoleId,
        role: roleName,
        manager_id: finalManagerId,
        manager_name: managerName,
      },
    });
  } catch (error) {
    console.error('Error in adminCreateUser:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Admin: Update User Role and/or Manager
export async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role, roleId, managerId } = req.body;

  try {
    let finalRoleId = roleId ? Number(roleId) : null;
    if (!finalRoleId && role) {
      const [roles] = await pool.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [role]);
      if (roles.length > 0) finalRoleId = roles[0].id;
    }

    const hasManagerId = managerId !== undefined;
    const finalManagerId = (managerId && managerId !== '' && managerId !== 'null') ? Number(managerId) : null;

    let updateFields = [];
    let queryParams = [];

    if (finalRoleId) {
      updateFields.push('role_id = ?');
      queryParams.push(finalRoleId);
    }

    if (hasManagerId) {
      updateFields.push('manager_id = ?');
      queryParams.push(finalManagerId);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid update fields provided' });
    }

    updateFields.push('updated_at = NOW()');
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    queryParams.push(id);

    const [result] = await pool.query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User details updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Admin: Delete User
export async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
