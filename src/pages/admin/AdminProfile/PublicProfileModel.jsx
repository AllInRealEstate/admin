import "./PublicProfileModel.css";

const PublicProfileModal = ({ worker, admin, isOpen, onClose }) => {
  if (!isOpen || !worker) return null;

  const workerName = worker?.translations?.en?.name || worker?.name || "Unnamed Profile";
  const workerTitle = worker?.translations?.en?.title || worker?.title || "Real Estate Agent";
  const initials = workerName ? workerName.substring(0, 2).toUpperCase() : "UN";
  
  return (
    <div className="elite-modal-overlay" onClick={onClose}>
      <div className="dossier-card" onClick={(e) => e.stopPropagation()}>
        
        {/* === 1. LUXURY HEADER (Dark Backdrop) === */}
        <div className="dossier-header">
          <div className="header-pattern"></div>
          <div className="header-controls">
            <span className="brand-tag">ALL IN SYSTEM</span>
            <button className="close-icon-btn" onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* === 2. IDENTITY OVERLAP SECTION === */}
        <div className="dossier-identity">
          <div className="avatar-overlap-wrapper">
            {worker?.image ? (
              <img src={worker.image} alt={workerName} className="dossier-avatar" />
            ) : (
              <div className="dossier-avatar-placeholder">{initials}</div>
            )}
            <div className={`status-bead ${worker.active ? "live" : "hidden"}`}></div>
          </div>

          <div className="identity-text">
            <h2 className="agent-name">{workerName}</h2>
            <p className="agent-title">{workerTitle}</p>
            <div className={`visibility-pill ${worker.active ? "is-visible" : "is-hidden"}`}>
              {worker.active ? "● Public Profile Active" : "● Hidden from Public"}
            </div>
          </div>
        </div>

        {/* === 3. FLOATING STATS STRIP === */}
        <div className="dossier-stats-strip">
          <div className="strip-item">
            <span className="strip-val">{worker?.stats?.yearsExperience || 0}</span>
            <span className="strip-lbl">Years Exp</span>
          </div>
          <div className="strip-divider"></div>
          <div className="strip-item">
            <span className="strip-val">{worker?.stats?.projectsCompleted || 0}</span>
            <span className="strip-lbl">Properties</span>
          </div>
          <div className="strip-divider"></div>
          <div className="strip-item">
            <span className="strip-val">{worker?.stats?.clientsSatisfied || 0}</span>
            <span className="strip-lbl">Clients</span>
          </div>
        </div>

        {/* === 4. CONTACT DATA === */}
        <div className="dossier-details">
          <div className="detail-block">
            <div className="detail-icon-box">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div className="detail-info">
              <span className="d-label">Email Address</span>
              <span className="d-value">{worker?.email || admin?.email || "N/A"}</span>
            </div>
          </div>

          <div className="detail-block">
            <div className="detail-icon-box">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="detail-info">
              <span className="d-label">License Number</span>
              <span className="d-value">{worker?.licenseNumber || "N/A"}</span>
            </div>
          </div>

          {worker?.phoneNumber && (
            <div className="detail-block">
              <div className="detail-icon-box">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div className="detail-info">
                <span className="d-label">Phone Number</span>
                <span className="d-value">{worker.phoneNumber}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Accent */}
        <div className="dossier-footer-gold"></div>

      </div>
    </div>
  );
};

export default PublicProfileModal;