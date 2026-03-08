import React from 'react';
import { Mail, Phone, MapPin, User, Tag, MessageSquare, Calendar } from 'lucide-react';
import './LeadDetailsContent.css';

const LeadDetailsContent = ({ lead, formatDate }) => {
  if (!lead) return null;

  return (
    <div className="lead-details-content">
      {/* Header */}
      <div className="details-section-header">
        <User size={16} />
        <span>Client Profile</span>
      </div>

      {/* Client Header */}
      <div className="client-header-row">
        <div className="client-avatar-circle">
          {lead.fullName?.charAt(0).toUpperCase()}
        </div>
        <div className="client-info">
          <h1 className="client-full-name" title={lead.fullName}>
            {lead.fullName}
          </h1>
          <div className="client-submitted-date">
            <Calendar size={12} />
            <span>Submitted {formatDate(lead.submittedAt)}</span>
          </div>
        </div>
      </div>

      {/* Contact Grid */}
      <div className="contact-info-grid">

        {/* Email */}
        <div className="info-card" title={lead.email}>
          <div className="info-icon-wrapper">
            <Mail size={16} />
          </div>
          <div className="info-content">
            <div className="info-label-text">Email</div>
            <div className="info-value-text">{lead.email}</div>
          </div>
        </div>

        {/* Phone */}
        <div className="info-card" title={lead.phoneNumber}>
          <div className="info-icon-wrapper">
            <Phone size={16} />
          </div>
          <div className="info-content">
            <div className="info-label-text">Phone</div>
            <div className="info-value-text">{lead.phoneNumber}</div>
          </div>
        </div>

        {/* Inquiry Type */}
        <div className="info-card">
          <div className="info-icon-wrapper">
            <Tag size={16} />
          </div>
          <div className="info-content">
            <div className="info-label-text">Inquiry Type</div>
            <div className="info-value-text">
              <span className="inquiry-type-badge">{lead.inquiryType}</span>
            </div>
          </div>
        </div>

        {/* Source */}
        <div className="info-card" title={lead.source || 'Website'}>
          <div className="info-icon-wrapper">
            <MapPin size={16} />
          </div>
          <div className="info-content">
            <div className="info-label-text">Source</div>
            <div className="info-value-text">{lead.source || 'Website'}</div>
          </div>
        </div>
      </div>

      {/* Message */}
      {lead.message && (
        <div className="original-inquiry-section">
          <div className="inquiry-header">
            <MessageSquare size={14} />
            <h4>Client Memo</h4>
          </div>
          <div className="inquiry-message-box">
            {lead.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetailsContent;