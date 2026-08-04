import { useState, useEffect, useCallback } from 'react';
import { getStoredUser } from '../services/authService';

const API_BASE_URL = 'http://localhost:5000/api';

function AdminPage({ userToken }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('EMPLOYEE');
  const [newManagerId, setNewManagerId] = useState('');
  const [message, setMessage] = useState(null);

  const storedUser = getStoredUser();
  const token = userToken || storedUser?.idToken || storedUser?.accessToken;

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/users`, { headers });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Create User by Admin
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          email: newEmail, 
          name: newName, 
          role: newRole, 
          managerId: newManagerId || null 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || `User ${newEmail} created successfully!` });
        setNewEmail('');
        setNewName('');
        setNewRole('EMPLOYEE');
        setNewManagerId('');
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create user' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server error while creating user' });
    }
  };

  // Update Role or Manager
  const handleUserUpdate = async (userId, updates) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'User details updated successfully' });
        fetchUsers();
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== userId));
        setMessage({ type: 'success', text: 'User account removed' });
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div className="page-admin fade-in">
      <div className="employee-layout">
        
        {/* Create User Form */}
        <section className="card form-card">
          <h2>Provision System User Account</h2>
          <p className="hero-subtitle" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Add employees or managers to the system database, set their role, and assign their reporting manager.
          </p>

          {message && (
            <div className={`alert-banner ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="claim-form">
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>User Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. john.doe@company.com" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ flex: 2 }}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label>Assign Role</label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="PENDING">PENDING (Approval Needed)</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="form-group" style={{ flex: 2 }}>
                <label>Reporting Manager</label>
                <select 
                  value={newManagerId}
                  onChange={(e) => setNewManagerId(e.target.value)}
                >
                  <option value="">None (Top Level / CEO)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) — {u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                + Provision User Account
              </button>
            </div>
          </form>
        </section>

        {/* User Directory Table */}
        <section className="card list-card">
          <h2>System User Directory</h2>
          {loading && <div className="no-items-text">Loading user accounts...</div>}
          
          <div className="table-responsive">
            <table className="claims-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Email</th>
                  <th>Assigned Role</th>
                  <th>Reporting Manager</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="claim-row">
                    <td>
                      <div className="claim-title">{user.name}</div>
                      <div className="claim-desc">ID: #{user.id}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${(user.role || 'pending').toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.manager_name ? (
                        <span style={{ fontWeight: 500 }}>{user.manager_name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', italic: 'true' }}>None (Top Level)</span>
                      )}
                    </td>
                    <td>{user.created_at ? String(user.created_at).substring(0, 10) : '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons" style={{ justifyContent: 'center', gap: '0.5rem' }}>
                        {/* Change Role */}
                        <select 
                          className="role-select"
                          value={user.role}
                          onChange={(e) => handleUserUpdate(user.id, { role: e.target.value })}
                          title="Change Role"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="EMPLOYEE">EMPLOYEE</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>

                        {/* Change Manager */}
                        <select 
                          className="role-select"
                          style={{ maxWidth: '140px' }}
                          value={user.manager_id || ''}
                          onChange={(e) => handleUserUpdate(user.id, { managerId: e.target.value || null })}
                          title="Change Reporting Manager"
                        >
                          <option value="">No Manager</option>
                          {users
                            .filter(m => m.id !== user.id)
                            .map(m => (
                              <option key={m.id} value={m.id}>
                                Mgr: {m.name}
                              </option>
                            ))}
                        </select>

                        <button 
                          className="btn btn-reject"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete User"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-state">No users found in database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

export default AdminPage;
