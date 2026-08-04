import ClaimRow from '../components/ClaimRow';

function ManagerPage({ 
  claims, 
  loading, 
  totalPending, 
  totalApproved, 
  totalAmount, 
  onStatusChange, 
  expandedClaimId, 
  onToggleExpand 
}) {
  return (
    <div className="page-manager fade-in">
      {/* Stats Overview */}
      <section className="stats-section">
        <div className="stat-card card">
          <div className="stat-value">{totalPending}</div>
          <div className="stat-label">Pending Claims</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value text-success">{totalApproved}</div>
          <div className="stat-label">Approved Claims</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">${totalAmount.toFixed(2)}</div>
          <div className="stat-label">Total Approved Amount</div>
        </div>
      </section>

      {/* Review Claims Table */}
      <section className="card list-card">
        <h2>Review Claims</h2>
        {loading && <div className="no-items-text">Loading claims from database...</div>}
        <div className="table-responsive">
          <table className="claims-table">
            <thead>
              <tr>
                <th>Claim Header</th>
                <th>Category</th>
                <th>Date</th>
                <th>Total Amount</th>
                <th>Sub-Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <ClaimRow 
                  key={claim.id}
                  claim={claim}
                  isExpanded={expandedClaimId === claim.id}
                  onToggleExpand={onToggleExpand}
                  onStatusChange={onStatusChange}
                  isManagerView={true}
                />
              ))}
              {!loading && claims.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-state">No claims found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ManagerPage;
