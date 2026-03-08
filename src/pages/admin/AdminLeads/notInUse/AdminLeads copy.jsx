import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getOptimizedLeads,
  getOptimizedTeamMembersForLeads,
  getLeadStats,
} from "../../../../services/LeadPageApi";
import { getCurrentAdmin } from "../../../../services/api";
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
  const [admin, setAdmin] = useState(null);

  // Data
  const [leads, setLeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [globalCounts, setGlobalCounts] = useState({
    all: 0, New: 0, Contacted: 0, InProgress: 0, Closed: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    search: "",
    priority: "",
    assignedTo: "",
    startDate: "",
    endDate: "",
    sort: "newest",
  });

  const [activeTab, setActiveTab] = useState("all");
  const [filtersExpanded, setFiltersExpanded] = useState(false); // Controls filter drawer
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---------------------------
  // INITIAL LOAD
  // ---------------------------
  useEffect(() => {
    const adminData = getCurrentAdmin();
    if (adminData) setAdmin(adminData);
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
  // FETCH DATA (Leads + Stats)
  // ---------------------------
  useEffect(() => {
    fetchData();
  }, [filters, activeTab, admin]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const baseFilters = { ...filters };

      // Force "Mine" view for regular admins
      if (admin?.role === "admin") {
        baseFilters.view = "mine";
      } else {
        baseFilters.view = "all";
      }

      // 1. Fetch Stats
      const statsData = await getLeadStats(baseFilters);
      setGlobalCounts({
        all: statsData.total || 0,
        New: statsData.new || 0,
        Contacted: statsData.contacted || 0,
        InProgress: statsData.inProgress || 0,
        Closed: statsData.closed || 0,
      });

      // 2. Fetch List
      const listFilters = { ...baseFilters };
      if (activeTab !== "all") listFilters.status = activeTab;

      const listData = await getOptimizedLeads(listFilters);
      setLeads(listData);
      setLoading(false);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError("Failed to load leads");
      setLoading(false);
    }
  };

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

  if (loading) return <div className="leads-loading"><div className="spinner-large"></div></div>;
  if (error) return <div className="leads-error"><p>{error}</p></div>;

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

      {/* 1) FILTERS TOGGLE BUTTON (Always Visible) */}
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

          {/* 4) ASSIGNED TO (Superadmin Only) */}
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

      {/* 2) STATUS TABS (Desktop) / DROPDOWN (Mobile) */}
      <div className="status-container">
        {/* Mobile View: Dropdown */}
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

        {/* Desktop View: Tabs */}
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

      {/* LEADS GRID */}
      <div className="leads-grid">
        {leads.length === 0 ? (
          <div className="no-leads"><p>No leads found matching your criteria</p></div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead._id}
              className="lead-card"
              onClick={() => navigate(`/admin/leads/${lead._id}`)}
            >
              <div className="card-header">
                <div className="card-header-info">
                  <h3>{lead.fullName}</h3>

                  {/* Row 1: Badges Only */}
                  <div className="lead-badges">
                    <span className={`status-badge status-${lead.status}`}>
                      {lead.status.toUpperCase()}
                    </span>
                    <span className={`priority-badge priority-${lead.priority}`}>
                      {lead.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Row 2: Assigned To (Separate Line) */}
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

                {/* Avatar (Right side) */}
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
          ))
        )}
      </div>
    </div>
  );
};

export default AdminLeads;