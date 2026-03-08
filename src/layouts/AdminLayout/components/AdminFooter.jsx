import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './AdminFooter.css';

const AdminFooter = ({ user, isCollapsed }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="sidebar-footer">
      <div className="user-mini-card">
        {/* Avatar - Using initials in circle (your original design) */}
        <div className="mini-avatar-text">
          {getInitials(user?.firstName, user?.lastName)}
        </div>
        
        {!isCollapsed && (
          <div className="mini-user-info">
            <div className="mini-name">{user?.firstName} {user?.lastName}</div>
            <div className="mini-role">{user?.role}</div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <button 
          className="footer-logout" 
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AdminFooter;