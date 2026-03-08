import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // <--- NEW IMPORTS
import {
  getOptimizedLeadById,
  updateLeadStatusOptimized,
  updateLeadPriorityOptimized,
  assignLeadOptimized,
  deleteLeadOptimized,
  getOptimizedTeamMembersForLeads,
} from "../../../../services/LeadPageApi";
import ActivityTimeline from './ActivityTimeline';
import { useAuth } from "../../../../context/AuthContext";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User,
  Tag,
  MessageSquare,
  Trash2,
  AlertCircle
} from 'lucide-react';
import './LeadDetailsPanel.css';

const LeadDetailsPanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---------------------------
  // 1. STATE & AUTH
  // ---------------------------
  const { admin } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Local form state for instant UI updates (Optimistic UI)
  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    adminNotes: '',
    assignedTo: ''
  });

  const [permissions, setPermissions] = useState({
    canEdit: false,
    canDelete: false,
    canAssign: false
  });

  // Load Admin on mount


  // ---------------------------
  // 2. DATA FETCHING (React Query)
  // ---------------------------

  // Fetch Lead Details
  const {
    data: lead,
    isLoading: leadLoading,
    isError: leadError,
    error
  } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => getOptimizedLeadById(id),
    enabled: !!id, // Only run if ID exists
  });

  // Fetch Team Members (Cached)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: getOptimizedTeamMembersForLeads,
    staleTime: 1000 * 60 * 5, // Keep fresh for 5 mins
  });

  // ---------------------------
  // 3. SYNCHRONIZATION
  // ---------------------------

  // Sync Form Data & Permissions when Lead loads
  useEffect(() => {
    if (lead) {
      setFormData({
        status: lead.status || 'New',
        priority: lead.priority || 'Medium',
        adminNotes: lead.notes || '',
        assignedTo: lead.assignedTo ? lead.assignedTo._id : ''
      });
    }
  }, [lead]);

  // Recalculate permissions when lead or admin changes
  useEffect(() => {
    if (lead && admin) {
      const isSuperAdmin = admin.role === 'superadmin';
      const isAssignedToMe = lead.assignedTo && lead.assignedTo._id === admin.workerProfile?._id;

      setPermissions({
        canEdit: isSuperAdmin || isAssignedToMe,
        canDelete: isSuperAdmin,
        canAssign: isSuperAdmin
      });
    }
  }, [lead, admin]);

  // ---------------------------
  // 4. MUTATIONS (Actions)
  // ---------------------------

  // Generic Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ func, args }) => {
      return await func(...args);
    },
    onSuccess: (updatedData) => {
      // 1. Update this specific lead in cache
      queryClient.setQueryData(['lead', id], (old) => ({ ...old, ...updatedData }));

      // 2. Mark the "Leads List" as stale so it refreshes next time we visit it
      queryClient.invalidateQueries(['leads']);
    },
    onError: (err) => {
      console.error("Update failed:", err);
      alert("Failed to update lead. Please try again.");
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLeadOptimized,
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']); // Refresh list
      navigate('/admin/leads');
    },
    onError: (err) => {
      console.error("Delete failed:", err);
      alert("Failed to delete lead");
      setShowDeleteModal(false);
    }
  });

  // ---------------------------
  // 5. HANDLERS
  // ---------------------------

  const handleAssignment = (newAssignedTo) => {
    if (!permissions.canAssign) return;

    // Optimistic Update
    setFormData(prev => ({ ...prev, assignedTo: newAssignedTo }));

    // Handle "Unassigned" (empty string)
    const valueToSend = newAssignedTo === "" ? null : newAssignedTo;

    updateMutation.mutate({
      func: assignLeadOptimized,
      args: [id, valueToSend]
    });
  };

  const handleStatusChange = (newStatus) => {
    if (!permissions.canEdit) return;
    setFormData(prev => ({ ...prev, status: newStatus })); // Optimistic UI

    updateMutation.mutate({
      func: updateLeadStatusOptimized,
      args: [id, newStatus]
    });
  };

  const handlePriorityChange = (newPriority) => {
    if (!permissions.canEdit) return;
    setFormData(prev => ({ ...prev, priority: newPriority })); // Optimistic UI

    updateMutation.mutate({
      func: updateLeadPriorityOptimized,
      args: [id, newPriority]
    });
  };

  const handleDelete = () => {
    if (!permissions.canDelete) return;
    deleteMutation.mutate(id);
  };

  // ---------------------------
  // 6. RENDER HELPERS
  // ---------------------------

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAssignedName = () => {
    if (!lead?.assignedTo) return "Unassigned";
    if (lead.assignedTo.translations?.en?.name) {
      return lead.assignedTo.translations.en.name;
    }
    return `${lead.assignedTo.firstName || ''} ${lead.assignedTo.lastName || ''}`;
  };

  // ---------------------------
  // 7. MAIN RENDER
  // ---------------------------

  if (leadLoading) {
    return (
      <div className="lead-details-loading">
        <div className="spinner-large"></div>
      </div>
    );
  }

  if (leadError || !lead) {
    return (
      <div className="lead-details-error">
        <AlertCircle size={48} />
        <p>{error?.message || 'Lead not found'}</p>
        <button onClick={() => navigate('/admin/leads')} className="btn-back">
          Back to Leads
        </button>
      </div>
    );
  }

  return (
    <div className="lead-details-page">
      <div className="lead-details-container">

        {/* Header */}
        <div className="page-header">
          <button className="btn-back" onClick={() => navigate('/admin/leads')}>
            <ArrowLeft size={20} />
            <span>Back to Leads</span>
          </button>

          <div className="header-actions">
            {permissions.canDelete && (
              <button
                className="btn-delete"
                onClick={() => setShowDeleteModal(true)}
                title="Delete Lead"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="details-content">

          {/* LEFT: Main Info */}
          <div className="details-main">

            {/* 1. Client Card */}
            <div className="details-section client-card">
              <div className="section-header">
                <User size={20} />
                <h2>Client Information</h2>
              </div>

              <div className="client-header-row">
                <div className="client-avatar">
                  {lead.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="client-name">{lead.fullName}</h1>
                  <div className="client-meta">
                    Submitted: {formatDate(lead.submittedAt)}
                  </div>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <Mail size={18} />
                  <div>
                    <div className="info-label">Email</div>
                    <div className="info-value">{lead.email}</div>
                  </div>
                </div>

                <div className="info-item">
                  <Phone size={18} />
                  <div>
                    <div className="info-label">Phone</div>
                    <div className="info-value">{lead.phoneNumber}</div>
                  </div>
                </div>

                <div className="info-item">
                  <Tag size={18} />
                  <div>
                    <div className="info-label">Inquiry Type</div>
                    <div className="info-value badge-style">{lead.inquiryType}</div>
                  </div>
                </div>

                {lead.source && (
                  <div className="info-item">
                    <MapPin size={18} />
                    <div>
                      <div className="info-label">Source</div>
                      <div className="info-value">{lead.source}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 🆕 Original Inquiry - Moved here from separate card */}
              {lead.message && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Original Inquiry
                  </h4>
                  <div className="bg-amber-50 text-amber-900 p-3 rounded-md text-sm italic border border-amber-100">
                    "{lead.message}"
                  </div>
                </div>
              )}
            </div>



          </div>

          {/* RIGHT: Management Sidebar */}
          <div className="details-sidebar">

            {/* Management Card */}
            <div className="details-section management-card">
              <h3>Lead Management</h3>

              {/* Status */}
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={!permissions.canEdit || updateMutation.isPending}
                  className={`form-select status-${formData.status}`}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {/* Priority */}
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  disabled={!permissions.canEdit || updateMutation.isPending}
                  className={`form-select priority-${formData.priority}`}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              {/* Assignment */}
              <div className="form-group">
                <label>Assigned To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => handleAssignment(e.target.value)}
                  disabled={!permissions.canAssign || updateMutation.isPending}
                  className="form-select"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.translations?.en?.name || "Unknown Member"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Current Assignment */}
              <div className="assigned-info-box">
                <div className="assigned-avatar-small">
                  {getAssignedName().charAt(0)}
                </div>
                <div className="assigned-text">
                  <span className="label">Currently:</span>
                  <span className="value">{getAssignedName()}</span>
                </div>
              </div>

            </div>

            {/* Quick Actions */}
            <div className="details-section">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <a
                  href={`mailto:${lead.email}`}
                  className="btn-action btn-email"
                >
                  <Mail size={18} />
                  <span>Send Email</span>
                </a>

                <a
                  href={`tel:${lead.phoneNumber}`}
                  className="btn-action btn-phone"
                >
                  <Phone size={18} />
                  <span>Call Client</span>
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* 🆕 Activity Timeline - Replaces old Message Card (Left Column) */}
        <div className="details-section">
          <ActivityTimeline leadId={id} />
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-icon">
                <AlertCircle size={48} />
              </div>
              <h2>Delete Lead?</h2>
              <p>Are you sure you want to delete this lead? This action cannot be undone.</p>
              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-confirm-delete"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Lead"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default LeadDetailsPanel;