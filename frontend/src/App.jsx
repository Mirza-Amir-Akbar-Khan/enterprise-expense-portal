import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import EmployeePage from './pages/EmployeePage';
import ManagerPage from './pages/ManagerPage';
import AdminPage from './pages/AdminPage';
import PendingPage from './pages/PendingPage';
import LoginPage from './pages/LoginPage';
import { getStoredUser, logoutCognito } from './services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [expandedClaimId, setExpandedClaimId] = useState(null);
  const [myClaims, setMyClaims] = useState([]);
  const [teamClaims, setTeamClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  const isAuthenticated = Boolean(user);
  const token = user?.idToken || user?.accessToken;

  const fetchMyClaims = useCallback(async () => {
    if (!isAuthenticated || !user?.email) return;
    try {
      setLoading(true);
      const url = `${API_BASE_URL}/claims?userEmail=${encodeURIComponent(user.email)}`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) setMyClaims(data.claims);
    } catch (err) {
      console.warn('fetchMyClaims failed:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, token]);

  const fetchTeamClaims = useCallback(async () => {
    if (!isAuthenticated || !user?.email || currentUserRole !== 'MANAGER') return;
    try {
      const url = `${API_BASE_URL}/claims?managerEmail=${encodeURIComponent(user.email)}`;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success) setTeamClaims(data.claims);
    } catch (err) {
      console.warn('fetchTeamClaims failed:', err);
    }
  }, [isAuthenticated, user, currentUserRole, token]);

  useEffect(() => { fetchMyClaims(); }, [fetchMyClaims]);
  useEffect(() => { fetchTeamClaims(); }, [fetchTeamClaims]);

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
        fetchMyClaims();
      } else {
        setMyClaims([{ id: myClaims.length + 1, ...newClaim, amount: calculatedAmount, items: draftItems, status: 'Pending' }, ...myClaims]);
      }
    } catch (err) {
      console.error('Error submitting claim:', err);
      setMyClaims([{ id: myClaims.length + 1, ...newClaim, amount: calculatedAmount, items: draftItems, status: 'Pending' }, ...myClaims]);
    }
  };

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
        setTeamClaims(teamClaims.map(c => c.id === id ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setTeamClaims(teamClaims.map(c => c.id === id ? { ...c, status: newStatus } : c));
    }
  };

  const toggleExpand = (id) => {
    setExpandedClaimId(expandedClaimId === id ? null : id);
  };

  const totalPending = useMemo(() => teamClaims.filter(c => c.status === 'Pending').length, [teamClaims]);
  const totalApproved = useMemo(() => teamClaims.filter(c => c.status === 'Approved').length, [teamClaims]);
  const totalAmount = useMemo(
    () => teamClaims.filter(c => c.status === 'Approved').reduce((acc, curr) => acc + (curr.amount || 0), 0),
    [teamClaims]
  );

  return (
    <div className="app-container">
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUserRole={currentUserRole}
        user={user}
        isAuthenticated={isAuthenticated}
        onOpenLogin={() => setShowLoginModal(true)}
        onSignOut={handleSignOut}
      />

      {showLoginModal && (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setShowLoginModal(false)}
        />
      )}

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
                isAuthenticated={isAuthenticated}
                user={user}
                onOpenLogin={() => setShowLoginModal(true)}
              />
            )}

            {activePage === 'employee' && (
              <EmployeePage
                claims={myClaims}
                loading={loading}
                onSubmitClaim={handleSubmitClaim}
                expandedClaimId={expandedClaimId}
                onToggleExpand={toggleExpand}
              />
            )}

            {activePage === 'manager' && (
              <ManagerPage
                claims={teamClaims}
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
