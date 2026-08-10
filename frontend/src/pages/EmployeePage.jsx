import { useState, useMemo } from 'react';
import ClaimItemsBuilder from '../components/ClaimItemsBuilder';
import ClaimRow from '../components/ClaimRow';

function EmployeePage({ claims, loading, onSubmitClaim, expandedClaimId, onToggleExpand }) {
  const [showForm, setShowForm] = useState(false);
  const [newClaim, setNewClaim] = useState({ title: '', description: '', category: 'Travel', date: '' });
  const [draftItems, setDraftItems] = useState([]);

  const calculatedFormTotal = useMemo(
    () => draftItems.reduce((acc, curr) => acc + curr.amount, 0),
    [draftItems]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newClaim.title || !newClaim.date) return;

    onSubmitClaim(newClaim, draftItems);

    setNewClaim({ title: '', description: '', category: 'Travel', date: '' });
    setDraftItems([]);
    setShowForm(false);
  };

  return (
    <div className="page-employee fade-in">
      <div className="employee-layout">
        {/* Claim Submission — compact toggle */}
        <section className="card form-card">
          <div className="form-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>My Expense Claims</h2>
            <button
              className={`btn ${showForm ? 'btn-outline' : 'btn-primary'}`}
              onClick={() => setShowForm(!showForm)}
              style={{ minWidth: '130px' }}
            >
              {showForm ? '✕ Cancel' : '+ New Claim'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="claim-form" style={{ marginTop: '1.5rem' }}>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Claim Title / Summary</label>
                  <input 
                    type="text" 
                    placeholder="E.g., New York Business Trip" 
                    value={newClaim.title}
                    onChange={(e) => setNewClaim({ ...newClaim, title: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={newClaim.category}
                    onChange={(e) => setNewClaim({ ...newClaim, category: e.target.value })}
                  >
                    <option value="Travel">Travel</option>
                    <option value="Meals">Meals</option>
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Claim Date</label>
                  <input 
                    type="date" 
                    value={newClaim.date}
                    onChange={(e) => setNewClaim({ ...newClaim, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description / Purpose</label>
                <input 
                  type="text" 
                  placeholder="Brief notes about the claim..." 
                  value={newClaim.description}
                  onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                />
              </div>

              {/* Sub-Items Builder */}
              <ClaimItemsBuilder draftItems={draftItems} setDraftItems={setDraftItems} />

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={draftItems.length === 0}>
                  Submit Claim (${calculatedFormTotal.toFixed(2)})
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Claims Table */}
        <section className="card list-card">
          <h2>Submitted Claims</h2>
          {loading && <div className="no-items-text">Loading claims from database...</div>}
          <div className="table-responsive">
            <table className="claims-table">
              <thead>
                <tr>
                  <th>Title &amp; Details</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Items</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map(claim => (
                  <ClaimRow 
                    key={claim.id}
                    claim={claim}
                    isExpanded={expandedClaimId === claim.id}
                    onToggleExpand={onToggleExpand}
                    isManagerView={false}
                  />
                ))}
                {!loading && claims.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-state">No claims found.</td>
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

export default EmployeePage;

