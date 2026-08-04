import { useState, useMemo } from 'react';

function ClaimItemsBuilder({ draftItems, setDraftItems }) {
  const [newItem, setNewItem] = useState({ 
    itemName: '', 
    category: 'Flight', 
    amount: '', 
    notes: '', 
    s3ObjectKey: '' 
  });

  const handleAddDraftItem = (e) => {
    e.preventDefault();
    if (!newItem.itemName || !newItem.amount) return;
    
    setDraftItems([
      ...draftItems, 
      { id: Date.now(), ...newItem, amount: parseFloat(newItem.amount) }
    ]);
    setNewItem({ itemName: '', category: 'Flight', amount: '', notes: '', s3ObjectKey: '' });
  };

  const handleRemoveDraftItem = (id) => {
    setDraftItems(draftItems.filter(item => item.id !== id));
  };

  const calculatedFormTotal = useMemo(
    () => draftItems.reduce((acc, curr) => acc + curr.amount, 0),
    [draftItems]
  );

  return (
    <div className="items-builder-section">
      <div className="builder-header">
        <h3>Claim Items (Line Breakdown)</h3>
        <span className="items-count-badge">
          {draftItems.length} {draftItems.length === 1 ? 'item' : 'items'} added
        </span>
      </div>

      {/* Add Sub-Item Form */}
      <div className="add-item-box">
        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Item Name / Description</label>
            <input 
              type="text" 
              placeholder="E.g., Flight Ticket / Hotel Stay" 
              value={newItem.itemName}
              onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Item Type</label>
            <select 
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            >
              <option value="Flight">Flight</option>
              <option value="Hotel">Hotel</option>
              <option value="Meals">Meals</option>
              <option value="Transport">Transport</option>
              <option value="Software License">Software License</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Amount ($)</label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              value={newItem.amount}
              onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row" style={{ alignItems: 'flex-end', marginTop: '0.75rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Item Notes (Optional)</label>
            <input 
              type="text" 
              placeholder="Invoice number, vendor name, etc." 
              value={newItem.notes}
              onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label>Receipt Proof / S3 Object Key</label>
            <input 
              type="text" 
              placeholder="e.g. receipts/2026/07/flight_receipt.pdf" 
              value={newItem.s3ObjectKey}
              onChange={(e) => setNewItem({ ...newItem, s3ObjectKey: e.target.value })}
            />
          </div>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleAddDraftItem}
            disabled={!newItem.itemName || !newItem.amount}
          >
            + Add Line Item
          </button>
        </div>
      </div>

      {/* List of Added Draft Items */}
      {draftItems.length > 0 && (
        <div className="draft-items-table-wrapper">
          <table className="sub-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Notes</th>
                <th>S3 Receipt Key</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {draftItems.map(item => (
                <tr key={item.id}>
                  <td>{item.itemName}</td>
                  <td><span className="chip-category">{item.category}</span></td>
                  <td>{item.notes || '—'}</td>
                  <td>
                    {item.s3ObjectKey ? (
                      <span className="receipt-tag" style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                        📎 {item.s3ObjectKey}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${item.amount.toFixed(2)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button" 
                      className="btn-remove-item"
                      onClick={() => handleRemoveDraftItem(item.id)}
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="claim-total-bar">
            <span>Total Claim Amount:</span>
            <span className="total-amount-val">${calculatedFormTotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClaimItemsBuilder;
