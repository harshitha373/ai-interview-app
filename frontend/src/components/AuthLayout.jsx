import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

// Icons for standard features
const IconAI = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
    <path d="M12 6v6l4 2"></path>
  </svg>
);

const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const IconChart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

function AuthLayout({ 
  children, 
  welcomeTitle = "Welcome Back to", 
  welcomeSubtitle = "Smarter Interviewing", 
  welcomeDesc = "Access your Shnoor AI account and continue your journey towards success. Practice, improve and perform with confidence." 
}) {
  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <Link to="/" className="auth-brand">
            <div className="global-logo-container" style={{ width: '40px', height: '40px', marginRight: '12px' }}>
              <img src="/shnoor_logo.png" alt="Shnoor AI" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
            </div>
            <span>Shnoor AI Systems</span>
          </Link>
          
          <div className="welcome-text">
            <h1>
              {welcomeTitle}
              <span>{welcomeSubtitle}</span>
            </h1>
            <p>{welcomeDesc}</p>
          </div>

          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="feature-icon-box"><IconAI /></div>
              <div className="feature-info">
                <h4>AI-Powered Interviews</h4>
                <p>Experience intelligent, adaptive interview sessions.</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <div className="feature-icon-box"><IconShield /></div>
              <div className="feature-info">
                <h4>Secure & Private</h4>
                <p>Your data and privacy are our top priority.</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <div className="feature-icon-box"><IconChart /></div>
              <div className="feature-info">
                <h4>Real-time Insights</h4>
                <p>Track your performance and improve continuously.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
          <ThemeToggle />
        </div>
        <div className="auth-form-container">
          <Link to="/" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Home
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
