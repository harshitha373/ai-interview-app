import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import './Landing.css';
import {
  Brain,
  Code,
  Shield,
  BarChart,
  Users,
  Activity,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="landing-page-root">
      <div className="bg-mesh"></div>

      {/* Header */}
      <header className="main-nav">
        <div className="nav-inner">
          <Link to="/" className="logo">
            <div className="global-logo-container" style={{ width: '38px', height: '38px', marginRight: '10px' }}>
              <img src="/shnoor_logo.png" alt="Shnoor Logo" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
            </div>
            <span className="logo-text">Shnoor AI <span className="logo-system-word">System</span></span>
          </Link>
          <nav className="nav-links">
            <a href="#features">Features</a>
            <a href="#why">Benefits</a>
            <a href="#workflow">Workflow</a>
            <a href="#pricing">Pricing</a>
            <a href="#contact">Contact</a>
            <div className="nav-auth">
              <ThemeToggle />
              <Link to="/login" className="login-link">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="container hero-content">
            <div className="hero-text-wrapper">
              <h1 className="hero-title">
                Master Your Interviews.<br />
                <span className="hero-subtitle-colored">Land Your Dream Role.</span>
              </h1>
              <p className="hero-subtitle">
                Practice for your interviews without the stress. Our friendly AI gives you a safe space to test your technical skills and get comfortable before the real thing.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary">
                  Start Practicing for Free <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section features-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Platform Features</h2>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-box"><Brain size={28} /></div>
                <h3>Smart AI Questions</h3>
                <p>Our AI asks you questions based on how you answer, just like a real person would, to truly understand what you know.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-box"><Shield size={28} /></div>
                <h3>Fair Environment</h3>
                <p>Our system makes sure everything is fair and secure during the interview so you can just focus on doing your best.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-box"><Code size={28} /></div>
                <h3>Tailored to You</h3>
                <p>Upload your resume and pick your role. Our AI will generate questions that actually matter for that specific job.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-box"><Activity size={28} /></div>
                <h3>Fast and Smooth</h3>
                <p>Talk naturally. Our AI understands what you're saying and keeps the technical conversation flowing smoothly.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-box"><BarChart size={28} /></div>
                <h3>Immediate Feedback</h3>
                <p>Find out how you did right away. Our AI will show you what you're good at and what you can improve.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon-box"><Users size={28} /></div>
                <h3>Completely Objective</h3>
                <p>Our AI just looks at your skills. No human bias or snap judgments—just a fair look at your ability to solve problems.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section id="why" className="section why-section">
          <div className="container">
            <h2 className="section-title">Why Choose Shnoor AI?</h2>
            <div className="why-grid">
              <div className="why-item">
                <h4>Built for Confidence</h4>
                <p>We focus on the human side of interviewing. Our AI is designed to be a supportive partner, helping you overcome anxiety before the real board interview.</p>
              </div>
              <div className="why-item">
                <h4>Industry Standard</h4>
                <p>Our question bank is curated by industry experts to match the current standards of top global companies, ensuring your preparation is always relevant.</p>
              </div>
              <div className="why-item">
                <h4>Data Privacy</h4>
                <p>Your practice sessions and resumes are handled with the highest security. We prioritize your privacy so you can practice with peace of mind.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="section workflow-section">
          <div className="container">
            <div className="workflow-container">
              <h2 className="section-title">How It Works</h2>
              <div className="workflow-grid">
                <div className="workflow-step">
                  <div className="step-badge">1</div>
                  <h4>Upload Your Resume</h4>
                  <p>Just upload your resume and tell us the job you want. Our AI uses that to figure out the best questions to ask you.</p>
                </div>
                <div className="workflow-step">
                  <div className="step-badge">2</div>
                  <h4>Practice Interviewing</h4>
                  <p>Have a real conversation with our AI interviewer. It will ask you questions and talk through your answers.</p>
                </div>
                <div className="workflow-step">
                  <div className="step-badge">3</div>
                  <h4>Get Your Results</h4>
                  <p>As soon as you're done, you'll get a simple report showing what went well and what you can brush up on.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="section pricing-section">
          <div className="container">
            <h2 className="section-title">Pricing</h2>
            <div className="pricing-grid">
              <div className="pricing-card">
                <h3>Basic Plan</h3>
                <div className="price-tag">Free</div>
                <p className="pricing-desc">Great if you are looking for a job and want to practice.</p>
                <ul className="pricing-features">
                  <li><CheckCircle2 size={18} /> 10 AI interviews a month</li>
                  <li><CheckCircle2 size={18} /> Basic feedback reports</li>
                  <li><CheckCircle2 size={18} /> Standard security</li>
                  <li><CheckCircle2 size={18} /> Help from our community</li>
                </ul>
                <Link to="/register" className="btn btn-outline full-width">Start for Free</Link>
              </div>
              <div className="pricing-card featured">
                <div className="featured-badge">RECOMMENDED</div>
                <h3>Enterprise</h3>
                <div className="price-tag">Custom</div>
                <p className="pricing-desc">For companies that want a better way to interview candidates.</p>
                <ul className="pricing-features">
                  <li><CheckCircle2 size={18} /> As many AI interviews as you need</li>
                  <li><CheckCircle2 size={18} /> Test for your specific tech stack</li>
                  <li><CheckCircle2 size={18} /> Extra security features</li>
                  <li><CheckCircle2 size={18} /> Reports with your company logo</li>
                </ul>
                <div className="btn btn-static full-width">Contact Sales</div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="section contact-section">
          <div className="container">
            <h2 className="section-title">Get in Touch</h2>
            <div className="contact-grid">
              <div className="contact-box">
                <div className="contact-icon-wrapper"><MapPin size={22} /></div>
                <strong>Global HQ</strong>
                <p>10009 Mount Tabor Road<br />Odessa, MO, USA</p>
              </div>
              <div className="contact-box">
                <div className="contact-icon-wrapper"><Mail size={22} /></div>
                <strong>Email</strong>
                <p>info@shnoor.com<br />proc@shnoor.com</p>
              </div>
              <div className="contact-box">
                <div className="contact-icon-wrapper"><Phone size={22} /></div>
                <strong>Phone</strong>
                <p>+90 419 14601<br />WhatsApp Support</p>
              </div>
              <div className="contact-box">
                <div className="contact-icon-wrapper"><Clock size={22} /></div>
                <strong>Support Hours</strong>
                <p>Mon - Fri: 10AM - 7PM<br />24/7 Enterprise Support</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-info">
              <div className="footer-logo">
                <div className="global-logo-container" style={{ width: '42px', height: '42px', marginRight: '12px' }}>
                  <img src="/shnoor_logo.png" alt="Shnoor Logo" style={{ height: '100%', width: '100%', objectFit: 'contain' }} />
                </div>
                <span>Shnoor AI System</span>
              </div>
              <p className="footer-brand-tag">BY SHNOOR INTERNATIONAL LLC</p>
              <p className="footer-description">Bridging Innovation and Trade with Expert IT Solutions. We specialize in IT consulting, product development, data & AI services, and global import-export operations across India, UAE, and beyond.</p>
            </div>
            <div className="footer-nav">
              <h4>Services</h4>
              <a href="https://www.shnoor.com/cloud-management" target="_blank" rel="noreferrer">Cloud Management <ExternalLink size={12} /></a>
              <a href="https://www.shnoor.com/enterprise-management" target="_blank" rel="noreferrer">Enterprise Management <ExternalLink size={12} /></a>
              <a href="https://www.shnoor.com/data-and-artificial-intelligence" target="_blank" rel="noreferrer">Data & AI <ExternalLink size={12} /></a>
              <a href="https://www.shnoor.com/consulting-and-staffing" target="_blank" rel="noreferrer">Consulting & Staffing <ExternalLink size={12} /></a>
            </div>
            <div className="footer-nav">
              <h4>Contact</h4>
              <a href="mailto:info@shnoor.com">info@shnoor.com</a>
              <a href="mailto:proc@shnoor.com">proc@shnoor.com</a>
              <a href="https://www.shnoor.com/privacy-policy" target="_blank" rel="noreferrer">Privacy Policy</a>
              <a href="https://www.shnoor.com/terms-and-conditions" target="_blank" rel="noreferrer">Terms & Conditions</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} Shnoor International LLC. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
