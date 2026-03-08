import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query"; // <--- NEW: React Query
import { useInView } from "react-intersection-observer"; // <--- NEW: Scroll Detector
import {
  getOptimizedLeads,
  getOptimizedTeamMembersForLeads,
  getLeadStats,
} from "../../../../services/LeadPageApi";
import { useAuth } from "../../../../context/AuthContext";
import {
  Search,
  Filter,
  Mail,
  Phone,
  Clock,
  X,
  ChevronDown,
  User
} from "lucide-react";
import "./AdminLeads.css";

const AdminLeads = () => {
  const navigate = useNavigate();

  // ---------------------------
  // STATE
  // ---------------------------
  const { admin } = useAuth();

  // Data for Filters & Stats
  const [teamMembers, setTeamMembers] = useState([]);
  const [globalCounts, setGlobalCounts] = useState({
    all: 0, New: 0, Contacted: 0, InProgress: 0, Closed: 0
  });

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    priority: "",
    assignedTo: "",
    startDate: "",
    endDate: "",
    sort: "newest",
  });

  const [activeTab, setActiveTab] = useState("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Note: 'loading' and 'error' are now handled by React Query (status, isFetching)

  // ---------------------------
  // 1. INITIAL SETUP
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

  // ---------------------------
  // 2. INFINITE SCROLL LOGIC
  // ---------------------------
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    error,
  } = useInfiniteQuery({
    queryKey: ["leads", filters, activeTab, admin?.role],
    enabled: !!admin,
    queryFn: ({ pageParam = 1 }) => {
      // Prepare filters for API
      const apiFilters = { ...filters };

      // Force "Mine" view for regular admins
      if (admin?.role === "admin") {
        apiFilters.view = "mine";
      } else {
        apiFilters.view = "all";
      }

      // Handle Status Tab
      if (activeTab !== "all") {
        apiFilters.status = activeTab;
      }

      // Call API with page param
      return getOptimizedLeads({ pageParam, filters: apiFilters });
    },
    getNextPageParam: (lastPage) => {
      // Check if there are more pages based on backend metadata
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined; // Stop fetching
    },
  });

  // Flatten the pages into a single list for rendering
  const allLeads = data?.pages.flatMap((page) => page.data) || [];

  // Trigger next page load when scrolling to bottom
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage]);


  // ---------------------------
  // 3. SEPARATE STATS FETCH
  // ---------------------------
  useEffect(() => {
    if (!admin) return;

    const fetchStats = async () => {
      try {
        // 1. Create a filter object that includes ALL current UI filters
        const statsFilters = {
          search: filters.search,
          priority: filters.priority,
          assignedTo: filters.assignedTo,
          startDate: filters.startDate,
          endDate: filters.endDate,
        };

        // 2. Enforce Role Permission (same as the list)
        if (admin.role === "admin") {
          statsFilters.view = "mine";
        } else {
          statsFilters.view = "all";
        }

        // 3. Call API with these specific filters
        const statsData = await getLeadStats(statsFilters);

        setGlobalCounts({
          all: statsData.total || 0,
          New: statsData.new || 0,
          Contacted: statsData.contacted || 0,
          InProgress: statsData.inProgress || 0,
          Closed: statsData.closed || 0,
        });
      } catch (err) {
        console.error("Stats error:", err);
      }
    };

    // ✅ Re-fetch whenever any filter changes
    fetchStats();
  }, [filters, admin]);


  // ---------------------------
  // HANDLERS
  // ---------------------------
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: "", priority: "", assignedTo: "", startDate: "", endDate: "", sort: "newest",
    });
    setActiveTab("all");
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter((v) => v !== "").length;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  // Helper Tabs Data
  const tabs = [
    { key: "all", label: "All Leads", count: globalCounts.all },
    { key: "New", label: "New", count: globalCounts.New },
    { key: "Contacted", label: "Contacted", count: globalCounts.Contacted },
    { key: "InProgress", label: "In Progress", count: globalCounts.InProgress },
    { key: "Closed", label: "Closed", count: globalCounts.Closed },
  ];

  return (
    <div className="admin-leads-page">
      <div className="leads-header">
        <h1>Lead Management</h1>
      </div>

      {/* SEARCH */}
      <div className="leads-search-bar">
        <input
          type="text"
          placeholder="Search leads..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="search-input"
        />
      </div>

      {/* FILTERS TOGGLE BUTTON */}
      <button
        className="filter-toggle-btn"
        onClick={() => setFiltersExpanded(!filtersExpanded)}
      >
        <div className="filter-btn-content">
          <Filter size={18} />
          <span>Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="filter-badge">{getActiveFilterCount()}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`filter-arrow ${filtersExpanded ? "open" : ""}`}
        />
      </button>

      {/* FILTER DRAWER */}
      <div className={`leads-filters ${filtersExpanded ? "expanded" : ""}`}>
        <div className="filter-dropdowns">

          {/* PRIORITY */}
          <div className="filter-group">
            <label>Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="filter-select"
            >
              <option value="">All Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* ASSIGNED TO (Superadmin Only) */}
          {admin?.role === "superadmin" && (
            <div className="filter-group">
              <label>Assigned To</label>
              <select
                value={filters.assignedTo}
                onChange={(e) => handleFilterChange("assignedTo", e.target.value)}
                className="filter-select"
              >
                <option value="">All Assignments</option>
                <option value="unassigned">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.translations?.en?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DATE FILTERS */}
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="filter-select"
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="filter-select"
            />
          </div>
        </div>

        {/* CLEAR FILTERS */}
        {getActiveFilterCount() > 0 && (
          <button className="btn-clear-filters" onClick={clearAllFilters}>
            <X size={16} /> Clear All
          </button>
        )}
      </div>

      {/* STATUS TABS / DROPDOWN */}
      <div className="status-container">
        {/* Mobile View */}
        <div className="status-mobile">
          <label>Status View:</label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="status-select-mobile"
          >
            {tabs.map(tab => (
              <option key={tab.key} value={tab.key}>
                {tab.label} ({tab.count})
              </option>
            ))}
          </select>
        </div>

        {/* Desktop View */}
        <div className="status-tabs-desktop">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`status-tab ${activeTab === tab.key ? "active" : ""}`}
            >
              <span className="tab-label">{tab.label}</span>
              <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* LEADS GRID (INFINITE SCROLL) */}
      <div className="leads-grid">
        {status === "pending" ? (
          <div className="leads-loading"><div className="spinner-large"></div></div>
        ) : status === "error" ? (
          <div className="leads-error"><p>Error loading leads</p></div>
        ) : allLeads.length === 0 ? (
          <div className="no-leads"><p>No leads found matching your criteria</p></div>
        ) : (
          <>
            {/* 1. Map Rendered List */}
            {allLeads.map((lead) => (
              <div
                key={lead._id}
                className="lead-card"
                onClick={() => navigate(`/admin/leads/${lead._id}`)}
              >
                <div className="card-header">
                  <div className="card-header-info">
                    <h3>{lead.fullName}</h3>

                    {/* Badges */}
                    <div className="lead-badges">
                      <span className={`status-badge status-${lead.status}`}>
                        {lead.status.toUpperCase()}
                      </span>
                      <span className={`priority-badge priority-${lead.priority}`}>
                        {lead.priority.toUpperCase()}
                      </span>
                    </div>

                    {/* Assigned To */}
                    <div className="card-assign-row" style={{ marginTop: "0.5rem" }}>
                      {lead.assignedTo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#555', fontSize: '0.85rem' }}>
                          <User size={14} />
                          <span style={{ fontWeight: 500 }}>
                            {lead.assignedTo.translations?.en?.name || "Unknown"}
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#999', fontStyle: 'italic', fontSize: '0.85rem' }}>
                          <User size={14} />
                          <span>Unassigned</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="card-avatar">
                    {lead.fullName?.substring(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="card-property">
                  <div className="property-label">Interested In</div>
                  <div className="property-name">{lead.inquiryType?.toUpperCase()}</div>
                </div>

                <div className="card-contact">
                  <div className="contact-item">
                    <Mail size={14} /> <span>{lead.email}</span>
                  </div>
                  <div className="contact-item">
                    <Phone size={14} /> <span>{lead.phoneNumber}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="card-date">
                    <Clock size={14} /> <span>{formatDate(lead.submittedAt)}</span>
                  </div>
                  <button className="btn-view-details">View</button>
                </div>
              </div>
            ))}

            {/* 2. Scroll Trigger (Invisible Div) */}
            <div
              ref={ref}
              className="scroll-trigger"
              style={{ width: '100%', height: '20px', marginTop: '20px', display: 'flex', justifyContent: 'center' }}
            >
              {isFetchingNextPage && (
                <div className="spinner-small" style={{ width: '24px', height: '24px', border: '3px solid #f3f3f3', borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLeads;