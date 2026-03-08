import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { refreshOptimizedProfile } from "../../../services/ProfileApi";
import { getAdminLeadStats, getGlobalPlatformStats } from "../../../services/LeadStatsApi";
import { useAuth } from "../../../context/AuthContext";
import PublicProfileModal from "./PublicProfileModel";
import "./AdminProfile.css";

const AdminProfile = () => {
  const { admin: authAdmin, loading: authLoading } = useAuth();
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);

  // Fetch optimized profile data
  const {
    data: queryAdmin,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["optimizedProfile", authAdmin?._id],
    queryFn: refreshOptimizedProfile,
    enabled: !!authAdmin?._id,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const admin = queryAdmin || authAdmin || null;

  // Identify Role & Data
  const isSuperAdmin = admin?.role === 'superadmin';
  const worker = admin?.workerProfile;
  const hasWorker = !!worker;
  const workerId = worker?._id || worker?.id;
  const workerName = hasWorker ? worker?.translations?.en?.name || "Unnamed Profile" : "No Public Profile";

  // Fetch Stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: isSuperAdmin ? ["platformStats"] : ["adminLeadStats", workerId],
    queryFn: () => isSuperAdmin ? getGlobalPlatformStats() : getAdminLeadStats(workerId),
    enabled: isSuperAdmin || (!!workerId && hasWorker),
    staleTime: 1000 * 60 * 5,
  });

  const stats = statsData || {
    currentClients: 0, dealsInProgress: 0, propertiesSold: 0,
    superAdminCount: 0, connectedAdmins: 0, totalLeads: 0, leadsToday: 0
  };

  // Format Helpers
  const joinDate = admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A";
  const adminInitials = admin?.firstName ? `${admin.firstName[0]}${admin.lastName?.[0] || ""}` : "AD";
  const profileImage = worker?.image;
  const displayPhone = admin?.phoneNumber || "Not Set";

  if ((authLoading || isLoading) && !admin) return <div className="profile-loading"><div className="spinner-gold"></div></div>;
  if (!admin) return <div className="profile-error">Session Expired</div>;

  return (
    <div className="profile-dashboard-stack">
      
      {/* === LIGHTBOX OVERLAY === */}
      {isImageOpen && profileImage && (
        <div className="image-lightbox-overlay" onClick={() => setIsImageOpen(false)}>
          <div className="lightbox-content">
            <img src={profileImage} alt="Full Profile" />
            <button className="close-lightbox" onClick={() => setIsImageOpen(false)}>&times;</button>
          </div>
        </div>
      )}

      {/* =========================================================
          ROW 1: CONTACT BAR (Cream Card)
      ========================================================= */}
      <div className="elite-card contact-bar">
        
        <div className="bar-item">
          <div className="bar-icon gold-bg">@</div>
          <div className="bar-info">
            <span className="lbl">Email Address</span>
            <span className="val">{admin.email}</span>
          </div>
        </div>

        <div className="bar-divider"></div>

        <div className="bar-item">
          <div className="bar-icon gold-bg">★</div>
          <div className="bar-info">
            <span className="lbl">Public Alias</span>
            <span className="val">{workerName}</span>
          </div>
        </div>

      </div>

      {/* =========================================================
          ROW 2: IDENTITY CARD (Cream Card)
      ========================================================= */}
      <div className="elite-card identity-card-row">
        
        {/* Left: Avatar */}
        <div className="id-card-left">
            <div className="avatar-section-standard">
              <div 
                className={`avatar-circle-standard ${profileImage ? 'clickable' : ''}`}
                onClick={() => profileImage && setIsImageOpen(true)}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder-standard">{adminInitials}</div>
                )}
              </div>
              <div className={`status-dot-standard ${isFetching ? 'pulsing' : 'online'}`}></div>
            </div>
        </div>

        {/* Center: Info */}
        <div className="id-card-center">
            <div className="brand-badge-small">
               <span className="b-gold">ALL</span>
               <span className="b-dark">IN</span>
            </div>
            
            <h1 className="user-name-standard">
              {admin.firstName} <span className="last-name-standard">{admin.lastName}</span>
            </h1>

            <div className="role-status-row">
              <span className="role-badge-standard">{isSuperAdmin ? "Super Admin" : "Admin"}</span>
              <div className="status-pill-standard">
                 <span className="pulse-indicator-standard"></span>
                 <span>Active</span>
              </div>
            </div>
        </div>

        {/* Right: Meta & Actions */}
        <div className="id-card-right">
             <div className="meta-box">
                <span className="m-lbl">Member Since</span>
                <span className="m-val-dark">{joinDate}</span>
             </div>
             
             <div className="meta-divider-v-dark"></div>

             <div className="meta-box">
                <span className="m-lbl">Public Profile</span>
                <span className={`m-val-dark ${hasWorker ? "link-green" : "link-grey"}`}>
                   {hasWorker ? "Linked" : "Unlinked"}
                </span>
             </div>

             <button 
              className={`action-btn-gold ${!hasWorker ? "disabled" : ""}`}
              onClick={() => hasWorker && setShowWorkerModal(true)}
              disabled={!hasWorker}
            >
              <span>View Public Card</span>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </button>
        </div>

      </div>

      {/* =========================================================
          ROW 3: PERFORMANCE OVERVIEW (Header + Cream Card)
      ========================================================= */}
      <div className="performance-section-full">
         <div className="perf-header-simple">
            <h3>Performance Overview</h3>
            <p>Real-time system analytics</p>
         </div>

         <div className="elite-card stats-bar">
            {isSuperAdmin ? (
               /* SUPER ADMIN STATS */
               <>
                  <div className="bar-item">
                     <div className="bar-info">
                        <span className="lbl">Super Admins</span>
                        <span className="sub">System Admins</span>
                     </div>
                     <div className="bar-val-large">{stats.superAdminCount}</div>
                  </div>

                  <div className="bar-divider"></div>

                  <div className="bar-item">
                     <div className="bar-info">
                        <span className="lbl">Active Users</span>
                        <span className="sub">Connected</span>
                     </div>
                     <div className="bar-val-large">{stats.connectedAdmins}</div>
                  </div>

                  <div className="bar-divider"></div>

                  <div className="bar-item">
                     <div className="bar-info">
                        <span className="lbl">Total Leads</span>
                        <span className="sub">Platform Wide</span>
                     </div>
                     <div className="bar-val-large">{stats.totalLeads}</div>
                  </div>

                  <div className="bar-divider"></div>

                  <div className="bar-item">
                     <div className="bar-info">
                        <span className="lbl">New Today</span>
                        <span className="sub">Last 24h</span>
                     </div>
                     <div className="bar-val-large">{stats.leadsToday}</div>
                  </div>
               </>
            ) : (
               /* WORKER STATS */
               <>
                  <div className="bar-item">
                     <div className="bar-icon gold-bg">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                     </div>
                     <div className="bar-info">
                        <span className="lbl">Current Clients</span>
                        <span className="sub">Active Assignments</span>
                     </div>
                     <div className="bar-val-large">{stats.currentClients}</div>
                  </div>

                  <div className="bar-divider"></div>

                  <div className="bar-item">
                     <div className="bar-icon orange-bg">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                     </div>
                     <div className="bar-info">
                        <span className="lbl">In Progress</span>
                        <span className="sub">Pipeline Deals</span>
                     </div>
                     <div className="bar-val-large">{stats.dealsInProgress}</div>
                  </div>

                  <div className="bar-divider"></div>

                  <div className="bar-item">
                     <div className="bar-icon green-bg">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                     </div>
                     <div className="bar-info">
                        <span className="lbl">Closed Deals</span>
                        <span className="sub">Completed</span>
                     </div>
                     <div className="bar-val-large">{stats.propertiesSold}</div>
                  </div>
               </>
            )}
         </div>
      </div>

      <PublicProfileModal
        worker={worker}
        admin={admin}
        isOpen={showWorkerModal}
        onClose={() => setShowWorkerModal(false)}
      />
    </div>
  );
};

export default AdminProfile;