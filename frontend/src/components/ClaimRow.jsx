function ClaimRow({ claim, isExpanded, onToggleExpand, onStatusChange, isManagerView }) {
  const itemCount = claim.items ? claim.items.length : 0;

  return (
    <tr className="claim-row-group">
      <td colSpan={isManagerView ? 7 : 6} style={{ padding: 0, borderBottom: 'none' }}>
        <div className={isManagerView ? "claim-row-main-manager" : "claim-row-main"}>
          <div>
            <div className="claim-title">{claim.title}</div>
            <div className="claim-desc">
              {claim.userName ? `Submitted by: ${claim.userName} (${claim.userEmail || ''})` : (claim.description || claim.title)}
            </div>
          </div>
          <div>{claim.category}</div>
          <div>{claim.date ? String(claim.date).substring(0, 10) : '—'}</div>
          <div className="claim-amount">${(claim.amount || 0).toFixed(2)}</div>
          <div>
            <button 
              className={`btn-items-toggle ${isExpanded ? 'active' : ''}`}
              onClick={() => onToggleExpand(claim.id)}
            >
              {itemCount} {itemCount === 1 ? 'item' : 'items'} {isExpanded ? '▲' : '▼'}
            </button>
          </div>
          <div>
            <span className={`status-badge status-${(claim.status || 'Pending').toLowerCase()}`}>
              {claim.status}
            </span>
          </div>
          {isManagerView && (
            <div>
              {claim.status === 'Pending' ? (
                <div className="action-buttons">
                  <button 
                    className="btn btn-approve"
                    onClick={() => onStatusChange(claim.id, 'Approved')}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn btn-reject"
                    onClick={() => onStatusChange(claim.id, 'Rejected')}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="no-actions">—</span>
              )}
            </div>
          )}
        </div>

        {/* Expanded Items Breakdown Pane */}
        {isExpanded && (
          <div className="expanded-items-pane fade-in">
            <h4>Item Breakdown for "{claim.title}"</h4>
            {claim.items && claim.items.length > 0 ? (
              <table className="sub-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Type</th>
                    <th>Notes</th>
                    <th>S3 Receipt Key</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {claim.items.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.itemName}</td>
                      <td><span className="chip-category">{item.category}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{item.notes || '—'}</td>
                      <td>
                        {item.s3ObjectKey ? (
                          <span style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                            📎 {item.s3ObjectKey}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>${(item.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-items-text">No detailed items recorded.</div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

export default ClaimRow;
