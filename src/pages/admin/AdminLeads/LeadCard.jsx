import React, { useState } from "react";
import {
  Mail,
  Phone,
  Clock,
  User,
  Trash2,
  UserPlus,
  PenLine,
  Eye,
  MessageSquare,
} from "lucide-react";
import "./LeadCard.css";

/* ─────────────────────────────────────────────
   LEAD CARD
   ───────────────────────────────────────────── */
const LeadCard = ({
  lead,
  isSelectMode,
  isSelected,
  onCardClick,
  onSelectToggle,
  onDelete,
  onAssign,
  onUpdate,
  formatDate,
  isSuperadmin,
}) => {


  // ── Helpers ──────────────────────────────────
  const getAssignedName = () => {
    if (!lead?.assignedTo) return "Unassigned";
    if (lead.assignedTo.translations?.en?.name) {
      return lead.assignedTo.translations.en.name;
    }
    return (
      `${lead.assignedTo.firstName || ""} ${lead.assignedTo.lastName || ""}`.trim() ||
      "Unknown"
    );
  };

  const getStatusLabel = (status) => {
    const labels = {
      InProgress: "IN PROGRESS",
      NotInterested: "NOT INTERESTED",
      NoAnswer: "NO ANSWER",
    };
    return labels[status] || status?.toUpperCase();
  };

  // ── Handlers ─────────────────────────────────
  const handleCardClick = (e) => {
    if (isSelectMode) {
      e.preventDefault();
      onSelectToggle(lead._id);
    } else {
      onCardClick(lead._id);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(lead._id);
  };

  const handleAssignClick = (e) => {
    e.stopPropagation();
    if (onAssign) onAssign(lead._id);
  };

  const handleUpdateClick = (e) => {
    e.stopPropagation();
    if (onUpdate) onUpdate(lead);
  };

  const handleViewDetails = (e) => {
    if (!isSelectMode) {
      e.stopPropagation();
      onCardClick(lead._id);
    }
  };

  // ── Render ────────────────────────────────────
  return (
    <>
      <div
        className={`lead-card ${isSelectMode ? "select-mode" : ""} ${isSelected ? "selected" : ""}`}
        onClick={handleCardClick}
      >
        {/* Select Mode Checkbox */}
        {isSelectMode && (
          <div className="card-checkbox">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelectToggle(lead._id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* Unread Badge */}
        {lead.unreadCount > 0 && (
          <div
            className="lead-unread-badge"
            title={`${lead.unreadCount} unread activities`}
          >
            {lead.unreadCount}
          </div>
        )}

        {/* ── Header ── */}
        <div className="card-header">
          <div className="card-header-info">
            <h3 title={lead.fullName}>{lead.fullName}</h3>

            {/* Status + Priority + Time inline (desktop) */}
            <div className="lead-badges-time-row">
              <span className={`status-badge status-${lead.status}`}>
                {getStatusLabel(lead.status)}
              </span>
              <span className={`priority-badge priority-${lead.priority}`}>
                {lead.priority?.toUpperCase()}
              </span>
              <span className="time-inline-badge">
                <Clock size={11} />
                {formatDate(lead.submittedAt)}
              </span>
            </div>

            {/* Time own row — mobile only (toggled via CSS) */}
            <div className="mobile-time-row">
              <Clock size={11} />
              <span>{formatDate(lead.submittedAt)}</span>
            </div>

            {/* Assigned Pill */}
            <div
              className="card-assign-row"
              title={`Assigned to: ${getAssignedName()}`}
            >
              <User size={13} className="assign-icon" />
              <span className="assign-name">{getAssignedName()}</span>
            </div>
          </div>

          <div className="card-avatar">
            {lead.fullName?.charAt(0)?.toUpperCase() || "?"}
          </div>
        </div>

        {/* ── Client Note / Memo Preview ── */}
        <div className="card-memo">
          <div className="memo-label">
            <MessageSquare size={11} />
            Client Note
          </div>
          {lead.message ? (
            <p className="memo-text">{lead.message}</p>
          ) : (
            <p className="memo-empty">No message provided</p>
          )}
        </div>

        {/* ── Inquiry Type ── */}
        <div className="card-property">
          <div className="property-label">Interested In</div>
          <div className="property-name">
            {lead.inquiryType?.toUpperCase() || "—"}
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="card-contact">
          <div className="contact-item">
            <Mail size={13} />
            <span>{lead.email || "Unknown"}</span>
          </div>
          <div className="contact-item">
            <Phone size={13} />
            <span>{lead.phoneNumber || "—"}</span>
          </div>
        </div>

        {/* ── Footer / Actions ── */}
        <div className="card-footer">
          {isSuperadmin && !isSelectMode && (
            <button className="btn-assign" onClick={handleAssignClick} title="Assign lead">
              <UserPlus size={13} />
              <span>Assign</span>
            </button>
          )}

          {!isSelectMode && (
            <button
              className="btn-update-card"
              onClick={handleUpdateClick}
              title="Update lead"
            >
              <PenLine size={13} />
              <span>Update</span>
            </button>
          )}

          {isSuperadmin && !isSelectMode && (
            <button
              className="btn-delete-card"
              onClick={handleDeleteClick}
              title="Delete lead"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          )}

          <button className="btn-view-details" onClick={handleViewDetails}>
            <Eye size={13} />
            View Details
          </button>
        </div>
      </div>

    </>
  );
};

export default LeadCard;