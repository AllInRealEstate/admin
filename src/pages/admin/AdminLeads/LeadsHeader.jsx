import React from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Plus,
  CheckSquare,
  Trash2,
  UserPlus,
} from "lucide-react";
import "./LeadsHeader.css";

const LeadsHeader = ({
  filters,
  handleFilterChange,
  filtersExpanded,
  setFiltersExpanded,
  getActiveFilterCount,
  clearAllFilters,
  teamMembers,
  admin,
  activeTab,
  setActiveTab,
  globalCounts,
  isSelectMode,
  setIsSelectMode,
  selectedLeads,
  isSelectAllMode,
  onSelectAll,
  onSelectAllDB,
  totalCount,
  loadedCount,
  onBulkDelete,
  onBulkAssign,
  onAddLead,
}) => {
  const isSuperadmin = admin?.role === "superadmin";
  const activeFilterCount = getActiveFilterCount();
  const isDisabled = selectedLeads.length === 0 && !isSelectAllMode;

  const tabs = [
    { key: "all", label: "All", count: globalCounts.all },
    { key: "New", label: "New", count: globalCounts.New },
    { key: "Contacted", label: "Contacted", count: globalCounts.Contacted },
    { key: "InProgress", label: "In Progress", count: globalCounts.InProgress },
    { key: "NoAnswer", label: "No Answer", count: globalCounts.NoAnswer },
    { key: "Closed", label: "Closed", count: globalCounts.Closed },
    { key: "NotInterested", label: "Not Interested", count: globalCounts.NotInterested },
  ];

  return (
    <div className="lh-container">

      {/* Zone A: Title Row */}
      <div className="lh-title-row">
        <h1 className="lh-title">Lead Management</h1>
        <div className="lh-title-meta">
          <span>{new Date().toLocaleDateString("en-GB")}</span>
          <span className="lh-title-meta-dot" />
          <span className="lh-title-meta-count">{globalCounts.all ?? 0} Leads</span>
        </div>
      </div>

      {/* Zone B: Command Bar or Select Bar */}
      {!isSelectMode ? (
        <div className="lh-command-bar">
          <div className="lh-search">
            <Search size={17} className="lh-search-icon" />
            <input
              type="text"
              className="lh-search-input"
              placeholder="Search by name, phone, email, or notes..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
          {isSuperadmin && (
            <>
              <button className="lh-btn-add" onClick={onAddLead}>
                <Plus size={16} /><span>Add Lead</span>
              </button>
              <button className="lh-btn-select" onClick={() => setIsSelectMode(true)}>
                <CheckSquare size={16} /><span>Select</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="lh-select-bar">
          <button className="lh-btn-cancel" onClick={() => setIsSelectMode(false)}>
            <X size={16} /><span>Cancel</span>
          </button>
          <span className="lh-select-divider" />
          <div className="lh-select-info">
            <span className="lh-select-count">
              {isSelectAllMode
                ? `All ${totalCount} leads selected`
                : `${selectedLeads.length} of ${totalCount} selected`}
            </span>
            <button className="lh-btn-select-page" onClick={onSelectAll}>
              {selectedLeads.length > 0 ? "Deselect Page" : "Select Page"}
            </button>
          </div>
          <div className="lh-select-actions">
            <button className="lh-btn-bulk-assign" onClick={onBulkAssign} disabled={isDisabled}>
              <UserPlus size={15} /><span>Assign</span>
            </button>
            <button className="lh-btn-bulk-delete" onClick={onBulkDelete} disabled={isDisabled}>
              <Trash2 size={15} /><span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Selection banners */}
      {isSelectMode && !isSelectAllMode && selectedLeads.length > 0 && selectedLeads.length === loadedCount && totalCount > loadedCount && (
        <div className="lh-banner lh-banner-page" onClick={onSelectAllDB}>
          All {loadedCount} leads on this page are selected.
          <strong>Select all {totalCount} leads in database</strong>
        </div>
      )}
      {isSelectMode && isSelectAllMode && (
        <div className="lh-banner lh-banner-db">
          All {totalCount} leads in the database are selected.
          <strong style={{ cursor: "pointer" }} onClick={onSelectAll}>Clear selection</strong>
        </div>
      )}

      {/* Zone C: Status Tabs (desktop) + Dropdown (mobile) */}
      {!isSelectMode && (
        <>
          {/* Desktop: pill tabs */}
          <div className="lh-tabs-row">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`lh-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="lh-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Mobile: dropdown */}
          <div className="lh-status-dropdown-wrap">
            <select
              className="lh-status-dropdown"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
            >
              {tabs.map((tab) => (
                <option key={tab.key} value={tab.key}>
                  {tab.label} ({tab.count})
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Zone D: Filters — collapsible on ALL screens */}
      {!isSelectMode && (
        <div className="lh-filters-zone">

          <button className="lh-filter-toggle" onClick={() => setFiltersExpanded(!filtersExpanded)}>
            <div className="lh-filter-toggle-left">
              <Filter size={16} />
              <span>Filters</span>
              {activeFilterCount > 0 && <span className="lh-filter-badge">{activeFilterCount}</span>}
            </div>
            <ChevronDown size={16} className={`lh-filter-arrow ${filtersExpanded ? "open" : ""}`} />
          </button>

          <div className={`lh-filter-drawer ${filtersExpanded ? "open" : ""}`}>
            <div className="lh-filters-inner">
              <div className="lh-section-label">
                <Filter size={12} />
                Filters
                {activeFilterCount > 0 && <span className="lh-filter-badge">{activeFilterCount}</span>}
              </div>

              {/* Grid class switches based on role */}
              <div className={`lh-filter-grid${isSuperadmin ? "" : " no-assignee"}`}>

                <div className="lh-filter-group">
                  <label className="lh-filter-label">Interest</label>
                  <select className="lh-filter-select" value={filters.inquiryType} onChange={(e) => handleFilterChange("inquiryType", e.target.value)}>
                    <option value="">All Interests</option>
                    <option value="buying">Buying</option>
                    <option value="selling">Selling</option>
                    <option value="renting">Renting</option>
                    <option value="land">Land</option>
                    <option value="consulting">Consulting</option>
                  </select>
                </div>

                <div className="lh-filter-group">
                  <label className="lh-filter-label">Priority</label>
                  <select className="lh-filter-select" value={filters.priority} onChange={(e) => handleFilterChange("priority", e.target.value)}>
                    <option value="">All Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* lh-assignee-group makes it span full width on mobile */}
                {isSuperadmin && (
                  <div className="lh-filter-group lh-assignee-group">
                    <label className="lh-filter-label">Assigned To</label>
                    <select className="lh-filter-select" value={filters.assignedTo} onChange={(e) => handleFilterChange("assignedTo", e.target.value)}>
                      <option value="">All Assignments</option>
                      <option value="unassigned">Unassigned</option>
                      {teamMembers.map((member) => (
                        <option key={member._id} value={member._id}>{member.translations?.en?.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="lh-filter-group">
                  <label className="lh-filter-label">From</label>
                  <input type="date" className="lh-filter-date" value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} />
                </div>

                <div className="lh-filter-group">
                  <label className="lh-filter-label">To</label>
                  <input type="date" className="lh-filter-date" value={filters.endDate} onChange={(e) => handleFilterChange("endDate", e.target.value)} />
                </div>

                {activeFilterCount > 0 && (
                  <div className="lh-filter-clear-wrap">
                    <button className="lh-btn-clear" onClick={clearAllFilters}>
                      <X size={14} />Clear All
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeadsHeader;