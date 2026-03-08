import React, { useState } from "react";
import { PenLine, X, Save } from "lucide-react";
import "./UpdateLeadModal.css";

const UpdateLeadModal = ({ lead, onClose, onSave }) => {
  // FIX 1: Strip out "Unknown" so it doesn't break the email validation
  const [formData, setFormData] = useState({
    fullName:    lead?.fullName === "Unknown" ? "" : (lead?.fullName || ""),
    phoneNumber: lead?.phoneNumber || "",
    email:       lead?.email === "Unknown" ? "" : (lead?.email || ""),
    message:     lead?.message     || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSave) onSave(formData);
    onClose();
  };

  // FIX 3: Listen for the Enter key to save (but allow new lines in the text area)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault(); // Prevent standard form submission behavior
      handleSubmit();     // Trigger our custom save logic
    }
  };

  return (
    // FIX 2: Removed the onClick handler from the overlay so it doesn't close accidentally
    <div className="ulm-overlay">
      <div className="ulm-modal" role="dialog" aria-modal="true" aria-labelledby="ulm-title">

        {/* Header */}
        <div className="ulm-header">
          <div className="ulm-header-left">
            <div className="ulm-header-icon">
              <PenLine size={17} />
            </div>
            <div>
              <p className="ulm-title" id="ulm-title">Update Lead</p>
              <p className="ulm-subtitle">{lead?.fullName === "Unknown" ? "Lead" : (lead?.fullName || "Lead")}</p>
            </div>
          </div>
          <button className="ulm-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          <div className="ulm-body">

            {/* Row: Name + Phone */}
            <div className="ulm-row">
              <div className="ulm-group">
                <label htmlFor="ulm-fullName">Full Name</label>
                <input
                  id="ulm-fullName"
                  name="fullName"
                  type="text"
                  className="ulm-input"
                  placeholder="Unknown"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>

              <div className="ulm-group">
                <label htmlFor="ulm-phone">
                  Phone Number <span className="ulm-required">*</span>
                </label>
                <input
                  id="ulm-phone"
                  name="phoneNumber"
                  type="tel"
                  className="ulm-input"
                  placeholder="+971 50 000 0000"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="ulm-group">
              <label htmlFor="ulm-email">Email</label>
              <input
                id="ulm-email"
                name="email"
                type="email"
                className="ulm-input"
                placeholder="Unknown"
                value={formData.email}
                onChange={handleChange}
              />
              <span className="ulm-hint">Leave blank to keep as "Unknown"</span>
            </div>

            {/* Message */}
            <div className="ulm-group">
              <label htmlFor="ulm-message">Client Note / Message</label>
              <textarea
                id="ulm-message"
                name="message"
                className="ulm-input ulm-textarea"
                placeholder="What is the client looking for?"
                value={formData.message}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* Footer */}
          <div className="ulm-footer">
            <button type="button" className="ulm-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ulm-btn-save">
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default UpdateLeadModal;