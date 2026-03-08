import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import {
  getOptimizedLeads,
  getOptimizedTeamMembersForLeads,
  getLeadStats,
  deleteLeadOptimized,
  bulkDeleteLeads,
  bulkAssignLeads,
  createLeadManually,
  updateLeadDetailsOptimized,
} from "../../../services/LeadPageApi";
import { useAuth } from "../../../context/AuthContext";
import LeadsHeader from "./LeadsHeader";
import LeadCard from "./LeadCard";
import UpdateLeadModal from "./Updateleadmodal";
import AddLeadModal from "./AddLeadModal";
import AssignLeadModal from "./AssignLeadModal";
import "./LeadDashboard.css";
import { toast } from "react-toastify";
import { useSocket } from "../../../hooks/useSocket";
import { useSocketContext } from "../../../context/SocketContext"


const LeadDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { admin } = useAuth();

  const { socket, connected } = useSocketContext();


  // ---------------------------
  // STATE
  // ---------------------------
  const [teamMembers, setTeamMembers] = useState([]);
  const [globalCounts, setGlobalCounts] = useState({
    all: 0,
    New: 0,
    Contacted: 0,
    InProgress: 0,
    Closed: 0,
    NotInterested: 0,
    NoAnswer: 0,
  });

  // Helper to safely get saved state
  const getSavedDashboardState = () => {
    try {
      const saved = sessionStorage.getItem('dashboardState');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const [filters, setFilters] = useState(() => {
    const savedState = getSavedDashboardState();
    return savedState?.filters || {
      search: "",
      priority: "",
      inquiryType: "",
      assignedTo: "",
      startDate: "",
      endDate: "",
      sort: "newest",
    };
  });

  const [activeTab, setActiveTab] = useState(() => {
    const savedState = getSavedDashboardState();
    return savedState?.activeTab || "all";
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Select Mode State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [leadToUpdate, setLeadToUpdate] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const isSuperadmin = admin?.role === "superadmin";

  // ---------------------------
  // HELPERS
  // ---------------------------
  const cleanFilters = (currentFilters) => {
    const cleaned = {};
    Object.keys(currentFilters).forEach((key) => {
      const value = currentFilters[key];
      if (value !== "" && value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  };

  const getApiFilters = () => {
    const apiFilters = cleanFilters(filters);
    if (admin?.role === "admin") {
      apiFilters.view = "mine";
    } else {
      apiFilters.view = "all";
    }
    if (activeTab !== "all") {
      apiFilters.status = activeTab;
    }
    return apiFilters;
  };


  const handleSingleAssignClick = (leadId) => {
    setSelectedLeads([leadId]); // Put this single lead into the selection array
    setIsSelectAllMode(false);
    setIsAssignModalOpen(true); // Open the modal
  };


  // 🔴 UPDATED: Real-time Unread Counter Listener (With Safety Check)
  useSocket('lead_unread_update', (data) => {
    queryClient.setQueriesData({ queryKey: ['leads'] }, (oldData) => {
      // 1. Safety Check: If no data, or if it's not an infinite query (no .pages), ignore it.
      if (!oldData || !oldData.pages) return oldData;

      // 2. Update the Infinite Query structure
      return {
        ...oldData,
        pages: oldData.pages.map(page => ({
          ...page,
          // 👇 CHANGE THIS FROM 'leads' TO 'data'
          data: page.data.map(lead => {
            if (lead._id === data.leadId) {
              return { ...lead, unreadCount: data.unreadCount };
            }
            return lead;
          })
        }))
      };
    });
  });
  // ---------------------------
  // REAL-TIME: NEW LEAD
  // ---------------------------
  useSocket(
    "new_lead",
    (payload) => {


      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      toast.info("🆕 New lead received");
    },
    [admin?.role],
    { enabled: !!admin }
  );



  // ---------------------------
  // REAL-TIME: LEAD ASSIGNED (Smart Toasts)
  // ---------------------------
  useSocket(
    "lead_assigned",
    (payload) => {


      // 1. Refresh Data
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });

      if (payload?.silent) return;

      // 2. Parse Payload
      const count = payload?.count || 1;
      const isUnassignment = payload?.unassigned === true;

      // Check if target is ME
      // Note: In bulk unassign, assignedTo might be null, but the socket is sent to my room.
      const assignedToId = payload?.assignedTo?._id || payload?.assignedTo;
      const isMine = (assignedToId && String(assignedToId) === String(admin?._id)) ||
        // Fallback: If I received a 'lead_assigned' event with unassigned=true, it means I lost them
        (isUnassignment && !assignedToId);

      // 3. Generate Message
      if (isMine) {
        // CASE: It happened to ME
        if (isUnassignment) {
          toast.warn(count > 1 ? `🚫 ${count} leads were unassigned from you` : `🚫 A lead was unassigned from you`);
        } else {
          toast.success(count > 1 ? `📥 You have been assigned ${count} new leads` : `📥 A new lead was assigned to you`);
        }
      } else if (admin?.role === "superadmin") {
        // CASE: Super Admin observing others
        const assigneeName = payload?.assignedTo?.translations?.en?.name || payload?.assignedTo?.name || "an agent";

        if (isUnassignment) {
          toast.info(`🚫 ${count} lead(s) unassigned`);
        } else {
          toast.info(`👤 ${count} lead(s) assigned to ${assigneeName}`);
        }
      }
    },
    [admin?._id, admin?.role],
    { enabled: !!admin }
  );

  // ---------------------------
  // REAL-TIME: LEAD STATUS CHANGED
  // ---------------------------
  useSocket(
    "lead_status_changed",
    (payload) => {


      // Refresh leads list and stats
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });


    },
    [admin?.role],
    { enabled: !!admin }
  );

  // ---------------------------
  // REAL-TIME: LEAD PRIORITY CHANGED
  // ---------------------------
  useSocket(
    "lead_priority_changed",
    (payload) => {


      // Refresh leads list and stats
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });


    },
    [admin?.role],
    { enabled: !!admin }
  );

  // ---------------------------
  // REAL-TIME: LEAD DELETED
  // ---------------------------
  useSocket(
    "lead_deleted",
    (payload) => {


      // Refresh leads list and stats immediately
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      if (payload?.silent) return;


    },
    [admin?.role],
    { enabled: !!admin }
  );

  // ---------------------------
  // REAL-TIME: BULK LEADS DELETED
  // ---------------------------
  useSocket(
    "bulk_leads_deleted",
    (payload) => {


      // Refresh leads list and stats
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });
      if (payload?.silent) return;

      const count = payload?.count || 0;

    },
    [admin?.role],
    { enabled: !!admin }
  );

  // ---------------------------
  // REAL-TIME: BULK ASSIGN COMPLETE
  // ---------------------------
  useSocket(
    "bulk_assign_complete",
    (payload) => {


      // 1. Refresh Data
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leadStats"] });



    },
    [admin?.role],
    { enabled: !!admin }
  );

  // ---------------------------
  // REAL-TIME: LEAD UPDATED (Name, Phone, Email, Memo)
  // ---------------------------
  useSocket(
    "lead_updated",
    (payload) => {
      // Refresh leads list so the card shows the new details instantly
      queryClient.invalidateQueries({ queryKey: ["leads"] });

      // (No need to invalidate leadStats because name/email changes don't change the tab counts!)
    },
    [admin?.role],
    { enabled: !!admin }
  );



  // ---------------------------
  // DATA FETCHING
  // ---------------------------
  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const data = await getOptimizedTeamMembersForLeads();
      setTeamMembers(data);
    } catch (error) {
      console.error("❌ Failed to load team members:", error);
    }
  };

  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["leads", filters, activeTab, admin?.role],
    enabled: !!admin,
    queryFn: ({ pageParam = 1 }) => {
      return getOptimizedLeads({ pageParam, filters: getApiFilters() });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
  });

  const allLeads = data?.pages.flatMap((page) => page.data) || [];
  const currentTotalCount = data?.pages[0]?.total || 0;

  // NEW: Save current view to sessionStorage whenever leads, filters, or tabs change
  useEffect(() => {
    sessionStorage.setItem('dashboardState', JSON.stringify({
      filters,
      activeTab,
      leadIds: allLeads.map(lead => lead._id)
    }));
  }, [filters, activeTab, allLeads]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);

  // Reset selection on filter change
  useEffect(() => {
    setSelectedLeads([]);
    setIsSelectAllMode(false);
  }, [filters, activeTab]);

  const { data: statsData } = useQuery({
    queryKey: ["leadStats", filters, admin?.role],
    enabled: !!admin,
    queryFn: async () => {
      const statsFilters = cleanFilters({
        search: filters.search,
        priority: filters.priority,
        assignedTo: filters.assignedTo,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      if (admin.role === "admin") statsFilters.view = "mine";
      else statsFilters.view = "all";

      return await getLeadStats(statsFilters);
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (statsData) {
      setGlobalCounts({
        all: statsData.total || 0,
        New: statsData.new || 0,
        Contacted: statsData.contacted || 0,
        InProgress: statsData.inProgress || 0,
        Closed: statsData.closed || 0,
        NotInterested: statsData.notInterested || 0,
        NoAnswer: statsData.noAnswer || 0,
      });
    }
  }, [statsData]);

  // ---------------------------
  // MUTATIONS
  // ---------------------------
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteLeads,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["leadStats"]);
      setSelectedLeads([]);
      setIsSelectMode(false);
      setIsSelectAllMode(false);
      closeConfirmDialog();
      toast.success(data.message || "Leads deleted successfully");
    },
    onError: (error) => {
      console.error("Bulk delete error:", error);
      toast.error(error.response?.data?.message || "Failed to delete leads");
      closeConfirmDialog();
    },
  });

  // ✅ NEW: Bulk Assign Mutation
  const bulkAssignMutation = useMutation({
    mutationFn: bulkAssignLeads,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["leadStats"]);
      setSelectedLeads([]);
      setIsSelectMode(false);
      setIsSelectAllMode(false);
      setIsAssignModalOpen(false);
      toast.success(data.message || "Leads assigned successfully");
    },
    onError: (error) => {
      console.error("Bulk assign error:", error);
      toast.error(error.response?.data?.message || "Failed to assign leads");
    },
  });

  // ---------------------------
  // HANDLERS
  // ---------------------------
  const handleSelectModeChange = (mode) => {
    setIsSelectMode(mode);
    if (!mode) {
      setSelectedLeads([]);
      setIsSelectAllMode(false);
    }
  };

  const handleSelectToggle = (leadId) => {
    if (isSelectAllMode) {
      setIsSelectAllMode(false);
      const newSelection = allLeads.map(l => l._id).filter(id => id !== leadId);
      setSelectedLeads(newSelection);
      return;
    }
    setSelectedLeads((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === allLeads.length) {
      setSelectedLeads([]);
      setIsSelectAllMode(false);
    } else {
      setSelectedLeads(allLeads.map((lead) => lead._id));
    }
  };

  const handleSelectAllDB = () => {
    setIsSelectAllMode(true);
    setSelectedLeads(allLeads.map((lead) => lead._id));
  };

  const handleBulkDelete = () => {
    if (selectedLeads.length === 0 && !isSelectAllMode) return;
    const count = isSelectAllMode ? currentTotalCount : selectedLeads.length;

    openConfirmDialog(
      "Confirm Bulk Deletion",
      `Are you sure you want to delete ${count} lead${count !== 1 ? "s" : ""}? ${isSelectAllMode ? "(ALL matching filters)" : ""
      } This action cannot be undone.`,
      () => {
        const payload = isSelectAllMode
          ? { selectAll: true, filters: getApiFilters(), excludedIds: [] }
          : { leadIds: selectedLeads };
        bulkDeleteMutation.mutate(payload);
      }
    );
  };

  //  Handle Bulk Assign Click
  const handleBulkAssignClick = () => {
    if (selectedLeads.length === 0 && !isSelectAllMode) return;
    setIsAssignModalOpen(true);
  };

  //  Handle Bulk Assign Confirm (from Modal)
  const handleBulkAssignConfirm = (agentId) => {
    const payload = isSelectAllMode
      ? {
        selectAll: true,
        filters: getApiFilters(),
        excludedIds: [],
        assignedTo: agentId
      }
      : {
        leadIds: selectedLeads,
        assignedTo: agentId
      };

    bulkAssignMutation.mutate(payload);
  };

  // Misc handlers
  const deleteMutation = useMutation({
    mutationFn: deleteLeadOptimized,
    onSuccess: () => {
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["leadStats"]);
      toast.success("Lead deleted successfully");
      closeConfirmDialog();
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete lead");
      closeConfirmDialog();
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: updateLeadDetailsOptimized,
    onSuccess: () => {
      queryClient.invalidateQueries(["leads"]);
      toast.success("Lead details updated successfully!");
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update lead details");
    },
  });

  const handleDeleteLead = (leadId) => {
    openConfirmDialog(
      "Confirm Deletion",
      "Are you sure you want to delete this lead? This action cannot be undone.",
      () => deleteMutation.mutate(leadId)
    );
  };

  const createMutation = useMutation({
    mutationFn: createLeadManually,
    onSuccess: () => {
      queryClient.invalidateQueries(["leads"]);
      queryClient.invalidateQueries(["leadStats"]);
      setIsAddModalOpen(false);
      toast.success("Lead created successfully!");
    },
    onError: (error) => {
      console.error("Create error:", error);
      toast.error(error.response?.data?.message || "Failed to create lead");
    },
  });

  const handleAddLead = (leadData) => {
    createMutation.mutate(leadData);
  };


  const openConfirmDialog = (title, message, onConfirm) => { setConfirmDialog({ isOpen: true, title, message, onConfirm }); };
  const closeConfirmDialog = () => { setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null }); };
  const handleFilterChange = (key, value) => { setFilters((prev) => ({ ...prev, [key]: value })); };
  const clearAllFilters = () => {
    setFilters({ search: "", priority: "", assignedTo: "", startDate: "", endDate: "", sort: "newest" });
    setActiveTab("all");
  };
  const getActiveFilterCount = () => Object.values(filters).filter((v) => v !== "").length;
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString("en-GB") : "Unknown";
  const handleCardClick = (leadId) => { if (!isSelectMode) navigate(`/admin/leads/${leadId}`); };

  return (
    <div className="lead-dashboard-page">
      <LeadsHeader
        filters={filters}
        handleFilterChange={handleFilterChange}
        filtersExpanded={filtersExpanded}
        setFiltersExpanded={setFiltersExpanded}
        getActiveFilterCount={getActiveFilterCount}
        clearAllFilters={clearAllFilters}
        teamMembers={teamMembers}
        admin={admin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        globalCounts={globalCounts}
        // Selection Props
        isSelectMode={isSelectMode}
        setIsSelectMode={handleSelectModeChange}
        selectedLeads={selectedLeads}
        isSelectAllMode={isSelectAllMode}
        onSelectAll={handleSelectAll}
        onSelectAllDB={handleSelectAllDB}
        totalCount={currentTotalCount}
        loadedCount={allLeads.length}
        onBulkDelete={handleBulkDelete}
        onBulkAssign={handleBulkAssignClick} // <--- PASSING THE HANDLER
        onAddLead={() => setIsAddModalOpen(true)}
      />

      <div className="leads-grid">
        {status === "pending" ? (
          <div className="leads-loading"><div className="spinner-large"></div></div>
        ) : status === "error" ? (
          <div className="leads-error"><p>Error loading leads</p></div>
        ) : allLeads.length === 0 ? (
          <div className="no-leads"><p>No leads found matching your criteria</p></div>
        ) : (
          <>
            {allLeads.map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead}
                isSelectMode={isSelectMode}
                isSelected={selectedLeads.includes(lead._id)}
                onCardClick={handleCardClick}
                onSelectToggle={handleSelectToggle}
                onDelete={handleDeleteLead}
                onUpdate={(selectedLead) => setLeadToUpdate(selectedLead)} // <--- 3. ADD THIS PROP
                onAssign={handleSingleAssignClick}
                formatDate={formatDate}
                isSuperadmin={isSuperadmin}
              />
            ))}
            <div ref={ref} className="scroll-trigger" style={{ width: "100%", height: "20px", marginTop: "20px" }}>
              {isFetchingNextPage && <div className="spinner-small"></div>}
            </div>
          </>
        )}
      </div>

      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddLead}
        teamMembers={teamMembers}
        isLoading={createMutation.isPending}
      />

      {/* Assign Lead Modal */}
      <AssignLeadModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onConfirm={handleBulkAssignConfirm}
        teamMembers={teamMembers}
        leadCount={isSelectAllMode ? currentTotalCount : selectedLeads.length}
        isSelectAllMode={isSelectAllMode}
      />

      {/* 4. ADD THE UPDATE MODAL HERE */}
      {leadToUpdate && (
        <UpdateLeadModal
          lead={leadToUpdate}
          onClose={() => setLeadToUpdate(null)}
          onSave={(updateData) => {
            updateDetailsMutation.mutate({
              leadId: leadToUpdate._id,
              updateData
            });
            setLeadToUpdate(null);
          }}
        />
      )}

      {confirmDialog.isOpen && (
        <div className="confirmation-overlay" onClick={closeConfirmDialog}>
          <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="confirmation-actions">
              <button className="btn-confirm-cancel" onClick={closeConfirmDialog}>Cancel</button>
              <button className="btn-confirm-delete" onClick={confirmDialog.onConfirm} disabled={bulkDeleteMutation.isPending}>
                {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDashboard;