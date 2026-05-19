import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../components/AuthLayout";
import "./Login.css";

const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const EyeIcon = ({ isVisible }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {isVisible ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </>
    )}
  </svg>
);

function ResetPassword() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/verify-reset-token/${token}`);
        if (res.data.valid) setValidToken(true);
        else setError("This reset link is invalid or has expired.");
      } catch (err) {
        setError("This reset link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/reset-password-with-token`, { token, newPassword });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed.");
    }
  };

  if (loading) {
    return (
      <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p>Verifying reset link...</p>
      </div>
    );
  }

  return (
    <AuthLayout 
      welcomeTitle="Reset Your" 
      welcomeSubtitle="Security Credentials" 
      welcomeDesc="Security is our priority. Please set a strong new password to regain access to your Shnoor AI dashboard."
    >
      <div className="auth-form-header">
        <h2>Set New Password</h2>
        <p>Create a strong new password for your account</p>
      </div>

      {!validToken ? (
        <div style={{ textAlign: 'center' }}>
          <div className="error-alert">{error}</div>
          <Link to="/forgot-password" style={{ display: 'inline-block', marginTop: '20px', color: '#0056D2', fontWeight: '700', textDecoration: 'none' }}>
            Request New Link
          </Link>
        </div>
      ) : message ? (
        <div style={{ background: '#ecfdf5', color: '#065f46', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #a7f3d0' }}>
          <p style={{ fontWeight: '700', marginBottom: '8px' }}>{message}</p>
          <p style={{ fontSize: '0.85rem' }}>Redirecting to login page...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="error-alert">{error}</div>}

          <div className="form-group">
            <label>New Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><IconLock /></span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter new password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required 
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                <EyeIcon isVisible={showPassword} />
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><IconLock /></span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Repeat new password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="auth-submit-btn">
            Update Password
          </button>
        </form>
      )}

      <div className="auth-footer" style={{ marginTop: '20px' }}>
        <Link to="/login">Back to Login</Link>
      </div>
    </AuthLayout>
  );
}

export default ResetPassword;
