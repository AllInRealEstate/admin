import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react"; // ✅ Import Icons

import { adminLogin } from "../../../services/LoginApi"; 
import { useAuth } from "../../../context/AuthContext";

import "./AdminLogin.css";

function AdminLogin() {
  const navigate = useNavigate();
  const { admin, login } = useAuth();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  // ✅ New state for password visibility
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockout, setLockout] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(10);

  // Auto redirect if already logged in
  useEffect(() => {
    if (admin && !loading) {
      navigate("/admin", { replace: true });
    }
  }, [admin, loading, navigate]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || lockout) return;

    // ... (Validation logic stays the same) ...
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (credentials.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await adminLogin(credentials.email, credentials.password);
      await login();
      // navigate is handled by useEffect
    } catch (error) {
      // ... (Error handling stays the same) ...
      if (error?.response?.status === 429) {
        toast.error("Too many attempts, please wait 10 minutes.");
        return;
      }
      const message = error?.response?.data?.error || "Invalid email or password";
      toast.error(message);
      
      const count = failedAttempts + 1;
      setFailedAttempts(count);
      if (count >= 5) {
        setLockout(true);
        setLockoutTime(10);
        toast.error("Too many attempts! Locked for 10 seconds.");
        const interval = setInterval(() => {
          setLockoutTime((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setLockout(false);
              setFailedAttempts(0);
              return 10;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-container">
        {/* HEADER */}
        <div className="admin-login-header">
          <img src="/logo-optimized.png" alt="Admin Logo" className="admin-login-logo" />
          <h1>Admin Panel</h1>
          <p>Secure access login</p>
        </div>

        {/* FORM */}
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={credentials.email}
              onChange={handleChange}
              disabled={loading || lockout}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper" style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"} // ✅ Toggles type
                name="password"
                placeholder="Enter password"
                value={credentials.password}
                onChange={handleChange}
                disabled={loading || lockout}
                required
                style={{ paddingRight: '40px' }} // Make room for the icon
              />
              
              {/* ✅ Eye Icon Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password-btn"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading || lockout}>
            {lockout
              ? `Try again in ${lockoutTime}s`
              : loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <div className="admin-login-footer">
          © All In Real Estate – Admin Portal
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;