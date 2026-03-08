import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOptimizedLeadById,
  updateLeadStatusOptimized,
  updateLeadPriorityOptimized,
  assignLeadOptimized,
  deleteLeadOptimized,
  getOptimizedTeamMembersForLeads,
  updateLeadDetailsOptimized,
} from "../../../../services/LeadPageApi";
import UnifiedHeader from './UnifiedHeader';
import LeadDetailsContent from './LeadDetailsContent';
import ActivityTimeline from './ActivityTimeline';
import { useAuth } from "../../../../context/AuthContext";
import { AlertCircle } from 'lucide-react';
import { toast } from "react-toastify";
import './LeadDetailsPanel.css';
import UpdateLeadModal from '../Updateleadmodal'


import { useSocketEmit, useSocket } from '../../../../hooks/useSocket';

const LeadDetailsPanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { admin } = useAuth();

  // ---------------------------
  // STATE
  // ---------------------------
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToUpdate, setLeadToUpdate] = useState(null);

  const emit = useSocketEmit();

  // ---------------------------
  // SOCKET: JOIN/LEAVE LEAD ROOM
  // ---------------------------
  useEffect(() => {
    if (!id || !emit) return;

    // Join lead room
    emit('join_lead_room', { leadId: id }, (response) => {

    });

    // Leave room on unmount
    return () => {
      emit('leave_lead_room', { leadId: id });

    };
  }, [id, emit]);

  // ---------------------------
  // SOCKET: ACTIVITY LOG (new activity entries)
  // ---------------------------
  useSocket(
    'activity_log',
    (payload) => {


      if (payload.leadId === id) {
        // Append new activity to timeline
        queryClient.setQueryData(['lead-activity', id], (old = []) => {
          // Check if activity already exists (prevent duplicates)
          const exists = old.some(a => a._id === payload.activity._id);
          if (exists) return old;
          return [...old, payload.activity];
        });
      }
    },
    [id]
  );

  // ---------------------------
  // SOCKET: COMMENT CREATE
  // ---------------------------
  useSocket(
    'comment_create',
    (payload) => {


      if (payload.leadId === id) {
        // Append new comment to timeline
        queryClient.setQueryData(['lead-activity', id], (old = []) => {
          const exists = old.some(a => a._id === payload.comment._id);
          if (exists) return old;
          return [...old, payload.comment];
        });
      }
    },
    [id]
  );


  // ---------------------------
  // SOCKET: LEAD STATUS CHANGED (in lead room)
  // ---------------------------
  useSocket(
    'lead_status_changed',
    (payload) => {


      if (payload.leadId === id) {
        // Update lead details
        queryClient.setQueryData(['lead', id], (old) => ({
          ...old,
          status: payload.newStatus
        }));

        // 🛑 CHECK SILENT FLAG
        if (payload?.silent) return;

        toast.info(`Status changed to ${payload.newStatus}`);
      }
    },
    [id]
  );


  // ---------------------------
  // SOCKET: LEAD PRIORITY CHANGED (in lead room)
  // ---------------------------
  useSocket(
    'lead_priority_changed',
    (payload) => {


      if (payload.leadId === id) {
        // Update lead details
        queryClient.setQueryData(['lead', id], (old) => ({
          ...old,
          priority: payload.newPriority
        }));

        // 🛑 CHECK SILENT FLAG
        if (payload?.silent) return;

        toast.info(`Priority changed to ${payload.newPriority}`);
      }
    },
    [id]
  );

  // ---------------------------
  // SOCKET: LEAD REASSIGNED (in lead room)
  // ---------------------------
  useSocket(
    'lead_reassigned',
    (payload) => {


      if (payload.leadId === id) {
        // Refresh lead details to get new assignee
        queryClient.invalidateQueries(['lead', id]);

        toast.info('Lead has been reassigned');
      }
    },
    [id]
  );

  // ---------------------------
  // SOCKET: LEAD ACCESS REVOKED (Kick-out for Delete OR Reassign)
  // ---------------------------
  useSocket(
    'lead_access_revoked',
    (payload) => {


      // ✅ 1. SECURITY CHECK: If I am the one who did the action, IGNORE this event.
      if (admin?.id === payload.actorId) return;

      if (payload.leadId === id) {
        const msg = payload.message || 'Access revoked. Redirecting...';

        // ✅ 2. PREVENT DOUBLE TOASTS
        // We use a unique ID so if the socket fires twice, only one toast appears.
        const toastOptions = { toastId: `kickout-${id}` };

        if (payload.reason === 'deleted') {
          toast.error(msg, toastOptions);
        } else {
          toast.warning(msg, toastOptions);
        }

        // Navigate away
        setTimeout(() => {
          navigate('/admin/leads');
        }, 2000);
      }
    },
    [id, navigate, admin]
  );

  // ---------------------------
  // SOCKET: LEAD ACTIVITY REFRESH (bulk operations)
  // ---------------------------
  useSocket(
    'lead_activity_refresh',
    (payload) => {


      if (payload.leadId === id) {
        // Refetch activity timeline
        queryClient.invalidateQueries(['lead-activity', id]);
      }
    },
    [id]
  );

// NEW: State for Activity Toggle (Default: Open)
  const [isActivityOpen, setIsActivityOpen] = useState(true);

  const [formData, setFormData] = useState({
    status: '',
    priority: '',
    assignedTo: ''
  });
  const [permissions, setPermissions] = useState({
    canEdit: false,
    canDelete: false,
    canAssign: false
  });

// NEW: State for Next/Prev Navigation
  const [navigationState, setNavigationState] = useState({
    prevId: null,
    nextId: null,
    currentIndex: -1,
    total: 0
  });

  // NEW: Swipe State & Animation Direction (Mobile)
  const [slideDirection, setSlideDirection] = useState('fade');
  const [touchStartXY, setTouchStartXY] = useState(null);
  const [touchEndXY, setTouchEndXY] = useState(null);

  // ---------------------------
  // SWIPE EVENT HANDLERS (Mobile)
  // ---------------------------
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEndXY(null);
    setTouchStartXY({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchMove = (e) => {
    setTouchEndXY({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  };

  const onTouchEnd = () => {
    if (!touchStartXY || !touchEndXY) return;
    
    const deltaX = touchStartXY.x - touchEndXY.x;
    const deltaY = touchStartXY.y - touchEndXY.y;

    // Ensure it's a horizontal swipe, not vertical scrolling
    if (Math.abs(deltaX) > Math.abs(deltaY) + 20) {
      if (deltaX > minSwipeDistance && navigationState.nextId) {
        setSlideDirection('left');
        navigate(`/admin/leads/${navigationState.nextId}`);
      }
      if (deltaX < -minSwipeDistance && navigationState.prevId) {
        setSlideDirection('right');
        navigate(`/admin/leads/${navigationState.prevId}`);
      }
    }
  };

  // ---------------------------
  // LEAD NAVIGATION (Next/Prev)
  // ---------------------------
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem('dashboardState');
      if (savedState) {
        const { leadIds } = JSON.parse(savedState);
        if (leadIds && leadIds.length > 0) {
          const index = leadIds.indexOf(id);
          setNavigationState({
            currentIndex: index,
            total: leadIds.length,
            prevId: index > 0 ? leadIds[index - 1] : null,
            nextId: index !== -1 && index < leadIds.length - 1 ? leadIds[index + 1] : null,
          });
        }
      }
    } catch (error) {
      console.error("Error reading session storage for lead navigation", error);
    }
  }, [id]);

const handlePrevLead = () => {
    if (navigationState.prevId) {
      setSlideDirection('right');
      navigate(`/admin/leads/${navigationState.prevId}`);
    }
  };

  const handleNextLead = () => {
    if (navigationState.nextId) {
      setSlideDirection('left');
      navigate(`/admin/leads/${navigationState.nextId}`);
    }
  };

  // ---------------------------
  // DATA FETCHING
  // ---------------------------
  const {
    data: lead,
    isLoading: leadLoading,
    isError: leadError,
    error
  } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => getOptimizedLeadById(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: getOptimizedTeamMembersForLeads,
    staleTime: 1000 * 60 * 5,
  });

  // ---------------------------
  // SYNCHRONIZATION
  // ---------------------------
  useEffect(() => {
    if (lead) {
      setFormData({
        status: lead.status || 'New',
        priority: lead.priority || 'Medium',
        assignedTo: lead.assignedTo ? lead.assignedTo._id : ''
      });
    }
  }, [lead]);

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
  // MUTATIONS
  // ---------------------------
  const updateMutation = useMutation({
    mutationFn: async ({ func, args }) => {
      return await func(...args);
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['lead', id], (old) => ({ ...old, ...updatedData }));
      queryClient.invalidateQueries(['leads']);
      toast.success("Lead updated successfully");
    },
    onError: (err) => {
      console.error("Update failed:", err);
      toast.error("Failed to update lead. Please try again."); // <--- TOAST
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLeadOptimized,
    onSuccess: () => {
      // 1. Navigate FIRST (gets user off the deleted lead page)
      navigate('/admin/leads');

      // 2. THEN invalidate queries (triggers refetch on leads list)
      setTimeout(() => {
        queryClient.invalidateQueries(['leads']);
        queryClient.removeQueries(['lead', id]); // Remove this lead from cache
      }, 100);
    },
    onError: (err) => {
      console.error("Delete failed:", err);
      toast.error("Failed to delete lead"); // <--- TOAST
      setShowDeleteModal(false);
    }
  });

  // ---------------------------
  // HANDLERS
  // ---------------------------
  const handleAssignment = (newAssignedTo) => {
    if (!permissions.canAssign) return;
    setFormData(prev => ({ ...prev, assignedTo: newAssignedTo }));
    const valueToSend = newAssignedTo === "" ? null : newAssignedTo;
    updateMutation.mutate({
      func: assignLeadOptimized,
      args: [id, valueToSend]
    });
  };

  const handleStatusChange = (newStatus) => {
    if (!permissions.canEdit) return;
    setFormData(prev => ({ ...prev, status: newStatus }));
    updateMutation.mutate({
      func: updateLeadStatusOptimized,
      args: [id, newStatus]
    });
  };

  const handlePriorityChange = (newPriority) => {
    if (!permissions.canEdit) return;
    setFormData(prev => ({ ...prev, priority: newPriority }));
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
  // HELPERS
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
  // RENDER
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
    <div className="lead-details-page-wrapper">
      {/* Unified Header (Sticky) */}
      <UnifiedHeader
        lead={lead}
        formData={formData}
        teamMembers={teamMembers}
        permissions={permissions}
        updateMutation={updateMutation}
        onBack={() => navigate('/admin/leads')}
        onDelete={() => setShowDeleteModal(true)}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onAssignmentChange={handleAssignment}
        getAssignedName={getAssignedName}
        isActivityOpen={isActivityOpen}
        onToggleActivity={() => setIsActivityOpen(!isActivityOpen)}
        onUpdate={() => setLeadToUpdate(lead)}
        onPrev={handlePrevLead}
        onNext={handleNextLead}
        hasPrev={!!navigationState.prevId}
        hasNext={!!navigationState.nextId}
        currentIndex={navigationState.currentIndex}
        totalLeads={navigationState.total}
      />

{/* Page Content (With Mobile Swipe Handlers) */}
      <div 
        className="lead-details-page-content"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Add CSS class when activity is closed + Animation Key/Class */}
        <div 
          key={id}
          className={`lead-details-container-new ${!isActivityOpen ? 'activity-closed' : ''} slide-anim-${slideDirection}`}
        >

          {/* Lead Details - Always Visible */}
          <LeadDetailsContent
            lead={lead}
            formatDate={formatDate}
          />

          {/* Activity Timeline - Conditional */}
          {isActivityOpen && (
            <div className="activity-timeline-wrapper">
              <ActivityTimeline leadId={id} />
            </div>
          )}

        </div>
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
      {/* Update Lead Modal */}
      {leadToUpdate && (
        <UpdateLeadModal
          lead={leadToUpdate}
          onClose={() => setLeadToUpdate(null)}
          onSave={(updateData) => {
            updateMutation.mutate({
              func: updateLeadDetailsOptimized,
              args: [{ leadId: leadToUpdate._id, updateData }]
            });
            setLeadToUpdate(null);
          }}
        />
      )}
    </div>
  );
};

export default LeadDetailsPanel;