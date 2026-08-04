import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import EmployeePage from './pages/EmployeePage';
import ManagerPage from './pages/ManagerPage';
import AdminPage from './pages/AdminPage';
import PendingPage from './pages/PendingPage';
import LoginPage from './pages/LoginPage';
import { getStoredUser, logoutCognito } from './services/authService';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activePage, setActivePage] = useState('home'); // 'home' | 'employee' | 'manager' | 'admin'
  const [expandedClaimId, setExpandedClaimId] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const isAuthenticated = Boolean(user);
  const token = user?.idToken || user?.accessToken;

  // Fetch claims from REST API (filters for employees/managers if logged in)
  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/claims`;
      if (isAuthenticated && user?.email) {
        if (currentUserRole === 'EMPLOYEE') {
          url += `?userEmail=${encodeURIComponent(user.email)}`;
        } else if (currentUserRole === 'MANAGER') {
          url += `?managerEmail=${encodeURIComponent(user.email)}`;
        }
      }
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) {
        setClaims(data.claims);
      }
    } catch (err) {
      console.warn('Backend API connection failed, using local state:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, currentUserRole, token]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Auto-sync Cognito user with MySQL database upon login
  const syncCognitoUser = useCallback(async (activeUser = user) => {
    if (!activeUser || !activeUser.email) return null;

    try {
      const activeToken = activeUser.idToken || activeUser.accessToken;
      const res = await fetch(`${API_BASE_URL}/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify({
          cognitoSub: activeUser.sub,
          email: activeUser.email,
          name: activeUser.name || activeUser.email.split('@')[0],
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUserRole(data.user.role);
        return data.user;
      }
    } catch (err) {
      console.error('Failed to sync Cognito user with database:', err);
    }
    return null;
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      syncCognitoUser(user);
    } else {
      setCurrentUserRole(null);
    }
  }, [isAuthenticated, user, syncCognitoUser]);

  // Auto-route logged in user to their assigned role screen
  useEffect(() => {
    if (isAuthenticated && currentUserRole) {
      if (currentUserRole === 'EMPLOYEE') setActivePage('employee');
      else if (currentUserRole === 'MANAGER') setActivePage('manager');
      else if (currentUserRole === 'ADMIN') setActivePage('admin');
    }
  }, [isAuthenticated, currentUserRole]);

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setShowLoginModal(false);
    syncCognitoUser(authenticatedUser);
  };

  const handleSignOut = () => {
    logoutCognito();
    setUser(null);
    setCurrentUserRole(null);
    setActivePage('home');
  };

  // Submit claim via API with authenticated user info if available
  const handleSubmitClaim = async (newClaim, draftItems) => {
    const calculatedAmount = draftItems.reduce((acc, curr) => acc + curr.amount, 0);
    const payload = {
      ...newClaim,
      items: draftItems,
      cognitoSub: user?.sub || null,
      userEmail: user?.email || null,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        fetchClaims();
      } else {
        const fallbackClaim = {
          id: claims.length + 1,
          ...newClaim,
          amount: calculatedAmount,
          items: draftItems,
          status: 'Pending',
        };
        setClaims([fallbackClaim, ...claims]);
      }
    } catch (err) {
      console.error('Error submitting claim:', err);
      const fallbackClaim = {
        id: claims.length + 1,
        ...newClaim,
        amount: calculatedAmount,
        items: draftItems,
        status: 'Pending',
      };
      setClaims([fallbackClaim, ...claims]);
    }
  };

  // Update claim status via API
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/claims/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus, reviewedBy: 2 }),
      });
      const data = await res.json();
      if (data.success) {
        setClaims(claims.map(claim => claim.id === id ? { ...claim, status: newStatus } : claim));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setClaims(claims.map(claim => claim.id === id ? { ...claim, status: newStatus } : claim));
    }
  };

  const toggleExpand = (id) => {
    setExpandedClaimId(expandedClaimId === id ? null : id);
  };

  // Manager Stats
  const totalPending = useMemo(() => claims.filter(c => c.status === 'Pending').length, [claims]);
  const totalApproved = useMemo(() => claims.filter(c => c.status === 'Approved').length, [claims]);
  const totalAmount = useMemo(
    () => claims.filter(c => c.status === 'Approved').reduce((acc, curr) => acc + (curr.amount || 0), 0),
    [claims]
  );

  return (
    <div className="app-container">
      {/* Top Navbar Component */}
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        currentUserRole={currentUserRole} 
        user={user}
        isAuthenticated={isAuthenticated}
        onOpenLogin={() => setShowLoginModal(true)}
        onSignOut={handleSignOut}
      />

      {/* Custom Login Modal */}
      {showLoginModal && (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setShowLoginModal(false)}
        />
      )}

      {/* Main Content Router */}
      <main className="main-content">
        {isAuthenticated && currentUserRole === 'PENDING' ? (
          <PendingPage 
            userEmail={user?.email} 
            onRefreshStatus={() => syncCognitoUser(user)} 
            onSignOut={handleSignOut}
          />
        ) : (
          <>
            {activePage === 'home' && (
              <HomePage 
                onNavigate={setActivePage} 
                isAuthenticated={isAuthenticated}
                user={user}
                onOpenLogin={() => setShowLoginModal(true)}
              />
            )}

            {activePage === 'employee' && (
              <EmployeePage 
                claims={claims}
                loading={loading}
                onSubmitClaim={handleSubmitClaim}
                expandedClaimId={expandedClaimId}
                onToggleExpand={toggleExpand}
              />
            )}

            {activePage === 'manager' && (
              <ManagerPage 
                claims={claims}
                loading={loading}
                totalPending={totalPending}
                totalApproved={totalApproved}
                totalAmount={totalAmount}
                onStatusChange={handleStatusChange}
                expandedClaimId={expandedClaimId}
                onToggleExpand={toggleExpand}
              />
            )}

            {activePage === 'admin' && (
              <AdminPage userToken={token} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
