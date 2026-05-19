import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthLayout from "../components/AuthLayout";
import "./Login.css";

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const IconSchool = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
  </svg>
);

const IconIdCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2"></rect>
    <line x1="7" y1="8" x2="17" y2="8"></line>
    <line x1="7" y1="12" x2="17" y2="12"></line>
    <line x1="7" y1="16" x2="12" y2="16"></line>
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

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("candidate-non-student");
  const [collegeName, setCollegeName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [collegesList, setCollegesList] = useState([]);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/colleges/active`);
        setCollegesList(res.data);
      } catch (err) { console.error(err); }
    };
    fetchColleges();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/register`, {
        name, email, password, role,
        collegeName: role === 'candidate-student' ? collegeName : null,
        rollNumber: role === 'candidate-student' ? rollNumber : null
      });
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <AuthLayout 
      welcomeTitle="Welcome to" 
      welcomeSubtitle="Smarter Interviewing" 
      welcomeDesc="Create your account and start your journey towards mastering interviews with AI-powered practice, real-time feedback and insights."
    >
      <div className="auth-form-header">
        <h2>Register</h2>
        <p>Create your account to start participating in AI interviews.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="error-alert">{error}</div>}

        <div className="form-group">
          <label>Full Name</label>
          <div className="input-wrapper">
            <span className="input-icon"><IconUser /></span>
            <input 
              type="text" 
              placeholder="Enter your full name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <div className="input-wrapper">
            <span className="input-icon"><IconMail /></span>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <span className="input-icon"><IconLock /></span>
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              <EyeIcon isVisible={showPassword} />
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <div className="input-wrapper">
            <span className="input-icon"><IconLock /></span>
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              placeholder="Confirm your password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
            />
            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              <EyeIcon isVisible={showConfirmPassword} />
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>User Role</label>
          <div className="input-wrapper">
            <span className="input-icon"><IconUser /></span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="candidate-student">Candidate (Student)</option>
              <option value="candidate-non-student">Candidate (Non-Student)</option>
            </select>
            <span className="input-icon" style={{ left: 'auto', right: '14px', pointerEvents: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>
        </div>

        {role === "candidate-student" && (
          <>
            <div className="form-group">
              <label>College / Institution Name</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconSchool /></span>
                <select value={collegeName} onChange={(e) => setCollegeName(e.target.value)} required>
                  <option value="">Select your college / institution</option>
                  {collegesList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <span className="input-icon" style={{ left: 'auto', right: '14px', pointerEvents: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Roll Number</label>
              <div className="input-wrapper">
                <span className="input-icon"><IconIdCard /></span>
                <input 
                  type="text" 
                  placeholder="Enter your roll number" 
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  required 
                />
              </div>
            </div>
          </>
        )}

        <button type="submit" className="auth-submit-btn">
          Create Account
        </button>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default Register;
