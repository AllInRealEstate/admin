import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import './LeadDashboard.css'; // Reusing dashboard styles

const AssignLeadModal = ({
  isOpen,
  onClose,
  onConfirm,
  teamMembers,
  leadCount,
  isSelectAllMode
}) => {
  const [selectedAgent, setSelectedAgent] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    // We allow selectedAgent to be empty string for "Unassign"
    onConfirm(selectedAgent);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#eff6ff',
              padding: '8px',
              borderRadius: '50%',
              color: '#2563eb'
            }}>
              <UserPlus size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Assign Leads</h2>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'left' }}>
          <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
            You are about to assign <strong>{leadCount}</strong> lead{leadCount !== 1 ? 's' : ''}
            {isSelectAllMode ? ' (from entire database)' : ''}.
          </p>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Team Member</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="filter-select"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <option value="">-- Unassign (Remove Agent) --</option>
              {teamMembers.map((member) => (
                <option
                  key={member._id}
                  value={member._id}
                  disabled={!member.hasAccount} // ← ADDED: Restrict selection
                >
                  {member.translations?.en?.name || member.firstName}
                  {!member.hasAccount ? ' (No Account)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '6px',
            fontSize: '0.85rem',
            color: '#92400e',
            display: 'flex',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>The assigned agent will receive an email notification immediately.</span>
          </div>
        </div>

        {/* Footer: Row layout with equal sizes */}
        <div className="modal-footer" style={{
          display: 'flex',
          gap: '12px',
          padding: '0 1.5rem 1.5rem',
          border: 'none'
        }}>
          <button
            className="btn-secondary"
            onClick={onClose}
            style={{
              flex: 1,
              margin: 0,
              height: '48px',
              borderRadius: '8px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e5e7eb',
              background: '#f9fafb',
              color: '#4b5563',
              cursor: 'pointer'
            }}
          >
            CANCEL
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            style={{
              flex: 1,
              margin: 0,
              height: '48px',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
            }}
          >
            CONFIRM ASSIGNMENT
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignLeadModal;