import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import "./AddLeadModal.css";

const INQUIRY_TYPES = [
  { value: "buying", label: "Buying" },
  { value: "selling", label: "Selling" },
  { value: "renting", label: "Renting" },
  { value: "land", label: "Land" },
  { value: "consulting", label: "Consulting" },
];

const PRIORITY_OPTIONS = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

const AddLeadModal = ({ isOpen, onClose, onSubmit, teamMembers, isLoading }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    inquiryType: "buying",
    priority: "Medium",
    assignedTo: "",
    message: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    // Full Name is optional
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone Number is required";

    // Only validate email format IF they typed something
    if (formData.email && formData.email.trim() !== "" && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Inject "Unknown" for empty names, leave email blank if empty
    const submissionData = {
      ...formData,
      fullName: formData.fullName.trim() === "" ? "Unknown" : formData.fullName,
      email: formData.email.trim() === "" ? "" : formData.email,
      source: "Manual Entry",
      status: "New"
    };

    onSubmit(submissionData);
  };

  const handleClose = () => {
    setFormData({
      fullName: "", email: "", phoneNumber: "",
      inquiryType: "buying", priority: "Medium", assignedTo: "", message: ""
    });
    setErrors({});
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="alm-overlay" onClick={handleOverlayClick}>
      <div className="alm-modal" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="alm-header">
          <div className="alm-header-left">
            <div className="alm-header-icon">
              <Plus size={18} strokeWidth={2.5} />
            </div>
            <div>
              <p className="alm-title">Add New Lead</p>
              <p className="alm-subtitle">Enter lead details manually</p>
            </div>
          </div>
          <button className="alm-close" onClick={handleClose} disabled={isLoading}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="alm-body">

            {/* Row 1: Name & Phone */}
            <div className="alm-row">
              <div className="alm-group">
                <label htmlFor="alm-fullName">Full Name</label>
                <input
                  id="alm-fullName"
                  name="fullName"
                  type="text"
                  className="alm-input"
                  placeholder="e.g. Michael Corleone"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div className="alm-group">
                <label htmlFor="alm-phone">
                  Phone Number <span className="alm-required">*</span>
                </label>
                <input
                  id="alm-phone"
                  name="phoneNumber"
                  type="tel"
                  className={`alm-input ${errors.phoneNumber ? 'error' : ''}`}
                  placeholder="+972 50 123 4567"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.phoneNumber && <span className="alm-error-msg">{errors.phoneNumber}</span>}
              </div>
            </div>

            {/* Row 2: Email & Interest */}
            <div className="alm-row">
              <div className="alm-group">
                <label htmlFor="alm-email">Email Address</label>
                <input
                  id="alm-email"
                  name="email"
                  type="email"
                  className={`alm-input ${errors.email ? 'error' : ''}`}
                  placeholder="client@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {errors.email && <span className="alm-error-msg">{errors.email}</span>}
              </div>

              <div className="alm-group">
                <label htmlFor="alm-inquiry">Interest</label>
                <select
                  id="alm-inquiry"
                  name="inquiryType"
                  className="alm-input"
                  value={formData.inquiryType}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  {INQUIRY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="alm-section-divider"></div>

            {/* Row 3: Priority & Agent */}
            <div className="alm-row">
              <div className="alm-group">
                <label htmlFor="alm-priority">Priority</label>
                <select
                  id="alm-priority"
                  name="priority"
                  className="alm-input"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div className="alm-group">
                <label htmlFor="alm-agent">Assign Agent</label>
                <select
                  id="alm-agent"
                  name="assignedTo"
                  className="alm-input"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option
                      key={m._id}
                      value={m._id}
                      disabled={!m.hasAccount}
                    >
                      {m.translations?.en?.name || "Unknown"}
                      {!m.hasAccount ? ' (No Account)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Message */}
            <div className="alm-group">
              <label htmlFor="alm-message">Internal Notes</label>
              <textarea
                id="alm-message"
                name="message"
                className="alm-input alm-textarea"
                placeholder="Any specific requirements or notes..."
                value={formData.message}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

          </div>

          {/* Footer */}
          <div className="alm-footer">
            <button type="button" className="alm-btn-cancel" onClick={handleClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="alm-btn-save" disabled={isLoading}>
              <Plus size={16} />
              {isLoading ? "Creating..." : "Create Lead"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddLeadModal;