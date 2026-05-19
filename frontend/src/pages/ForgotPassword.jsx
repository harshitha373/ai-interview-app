import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../components/AuthLayout";
import "./Login.css";

const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/forgot-password`, { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      welcomeTitle="Forgot Password?" 
      welcomeSubtitle="No Worries" 
      welcomeDesc="We'll help you get back to your account. Enter your registered email to receive a password reset link."
    >
      <div className="auth-form-header">
        <h2>Forgot Password</h2>
        <p>Enter your email to reset your password</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="error-alert">{error}</div>}
        {message && <div style={{ background: '#ecfdf5', color: '#065f46', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #a7f3d0' }}>{message}</div>}

        {!message && (
          <>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconMail /></span>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </>
        )}

        <div className="auth-footer">
          Remember your password? <Link to="/login">Sign In</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;
