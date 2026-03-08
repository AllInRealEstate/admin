import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, Trash2, ChevronDown, ChevronUp, Settings, MessageSquare } from 'lucide-react';
import './UnifiedHeader.css';

const UnifiedHeader = ({
  lead,
  formData,
  teamMembers,
  permissions,
  updateMutation,
  onBack,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onAssignmentChange,
  getAssignedName,
  // New props
  isActivityOpen,
  onToggleActivity
}) => {
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  if (!lead) return null;

  // Status color mapping from AdminLeads.css
  const getStatusClass = (status) => {
    const classes = {
      'New': 'status-new',
      'Contacted': 'status-contacted',
      'InProgress': 'status-inprogress',
      'Closed': 'status-closed',
      'NotInterested': 'status-not-interested'
    };
    return classes[status] || 'status-new';
  };

  // Priority color mapping from AdminLeads.css
  const getPriorityClass = (priority) => {
    const classes = {
      'High': 'priority-high',
      'Medium': 'priority-medium',
      'Low': 'priority-low'
    };
    return classes[priority] || 'priority-medium';
  };

  return (
    <div className="unified-header">

      {/* DESKTOP: Single Compact Row */}
      <div className="header-desktop-compact">
        <div className="header-container-compact">

          {/* Back Button */}
          <button className="btn-back-header" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Leads</span>
          </button>

          <div className="header-divider"></div>

          {/* Lead Name */}
          <h1 className="lead-name-header">{lead.fullName}</h1>

          <div className="header-divider"></div>

          {/* Status Badges - Inline */}
          <div className="status-badges-container">
            <span className={`status-badge-header ${getStatusClass(formData.status)}`}>
              {formData.status === 'InProgress' ? 'IN PROGRESS' : formData.status.toUpperCase()}
            </span>

            <span className={`priority-badge-header ${getPriorityClass(formData.priority)}`}>
              {formData.priority.toUpperCase()}
            </span>

            <span className="assignment-badge-header">
              {getAssignedName().toUpperCase()}
            </span>
          </div>

          <div className="header-divider"></div>

          {/* Action Buttons - Icons Only */}
          <div className="action-buttons-grid">

            {/* NEW: Toggle Activity Button */}
            <button
              onClick={onToggleActivity}
              className={`btn-header-action ${isActivityOpen ? 'active-toggle' : ''}`}
              title={isActivityOpen ? "Close Activity Panel" : "Open Activity Panel"}
              style={isActivityOpen ? { backgroundColor: '#f0f0f0', borderColor: '#d4af37', color: '#d4af37' } : {}}
            >
              <MessageSquare size={16} />
            </button>

            <a
              href={`mailto:${lead.email}`}
              className="btn-header-action btn-email-header"
              title="Send Email"
            >
              <Mail size={16} />
            </a>

            <a
              href={`tel:${lead.phoneNumber}`}
              className="btn-header-action btn-phone-header"
              title="Call Client"
            >
              <Phone size={16} />
            </a>

            <button
              onClick={() => setIsManagementOpen(!isManagementOpen)}
              className={`btn-header-action btn-manage-header ${isManagementOpen ? 'active' : ''}`}
              title={isManagementOpen ? 'Close Management' : 'Manage Lead'}
            >
              <Settings size={16} />
              {isManagementOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{isManagementOpen ? 'Close' : 'Manage'}</span>
            </button>

            {permissions.canDelete && (
              <button
                onClick={onDelete}
                className="btn-header-action btn-delete-header"
                title="Delete Lead"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE: 3-Row Layout */}
      <div className="header-mobile-rows">
        {/* Row 1: Back Button + Lead Name */}
        <div className="header-row-1">
          <div className="header-container">
            <button className="btn-back-header" onClick={onBack}>
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>

            <h1 className="lead-name-header">{lead.fullName}</h1>

            <div className="header-spacer"></div>
          </div>
        </div>

        {/* Row 2: Status Badges */}
        <div className="header-row-2">
          <div className="header-container">
            <div className="status-badges-container">
              <span className={`status-badge-header ${getStatusClass(formData.status)}`}>
                {formData.status === 'InProgress' ? 'IN PROGRESS' : formData.status.toUpperCase()}
              </span>

              <span className={`priority-badge-header ${getPriorityClass(formData.priority)}`}>
                {formData.priority.toUpperCase()}
              </span>

              <span className="assignment-badge-header">
                ASSIGNED: {getAssignedName().toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Action Buttons */}
        <div className="header-row-3">
          <div className="header-container">
            <div className="action-buttons-grid">

              {/* NEW: Toggle Activity (Mobile) */}
              <button
                onClick={onToggleActivity}
                className={`btn-header-action ${isActivityOpen ? 'active-toggle' : ''}`}
                style={isActivityOpen ? { backgroundColor: '#f0f0f0', borderColor: '#d4af37', color: '#d4af37' } : {}}
              >
                <MessageSquare size={18} />
                <span>Activity</span>
              </button>

              <a
                href={`mailto:${lead.email}`}
                className="btn-header-action btn-email-header"
              >
                <Mail size={18} />
                <span>Email</span>
              </a>

              <a
                href={`tel:${lead.phoneNumber}`}
                className="btn-header-action btn-phone-header"
              >
                <Phone size={18} />
                <span>Call</span>
              </a>

              <button
                onClick={() => setIsManagementOpen(!isManagementOpen)}
                className={`btn-header-action btn-manage-header ${isManagementOpen ? 'active' : ''}`}
              >
                <Settings size={18} />
                <span>Manage</span>
              </button>

              {permissions.canDelete && (
                <button
                  onClick={onDelete}
                  className="btn-header-action btn-delete-header"
                >
                  <Trash2 size={18} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Management Panel */}
      <div className={`management-panel ${isManagementOpen ? 'expanded' : ''}`}>
        <div className="header-container">
          <div className="management-panel-content">
            <div className="panel-header">
              <div className="panel-icon">
                <Settings size={18} />
              </div>
              <h3>Edit Lead Management</h3>
            </div>
            <div className="management-controls-grid">
              <div className="control-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => onStatusChange(e.target.value)}
                  disabled={!permissions.canEdit || updateMutation.isPending}
                  className="control-select"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Closed">Closed</option>
                  <option value="NotInterested">Not Interested</option> // ← ADDED: Dropdown option
                </select>
              </div>
              <div className="control-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => onPriorityChange(e.target.value)}
                  disabled={!permissions.canEdit || updateMutation.isPending}
                  className="control-select"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="control-group">
                <label>Assigned To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => onAssignmentChange(e.target.value)}
                  disabled={!permissions.canAssign || updateMutation.isPending}
                  className="control-select"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(member => (
                    <option
                      key={member._id}
                      value={member._id}
                      disabled={!member.hasAccount} // ← ADDED: Restrict selection
                    >
                      {member.translations?.en?.name || "Unknown Member"}
                      {!member.hasAccount ? ' (No Login)' : ''} 
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="current-assignment-box">
              <div className="assignment-avatar">
                {getAssignedName().charAt(0)}
              </div>
              <div className="assignment-text">
                <span className="assignment-label">Currently</span>
                <span className="assignment-value">{getAssignedName()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedHeader;