import React, { useState } from 'react';
import {
  Users, Building2, TrendingUp, Briefcase,
  ShieldCheck, FileText, ArrowRight, LogIn,
  UserPlus, Menu, X, CheckCircle2, Sparkles,
  LayoutDashboard, Search, ExternalLink
} from 'lucide-react';

const HomePage = ({ onNavigate, currentUser }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNav = (path) => {
    setMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate(path);
    }
  };

  return (
    <div className="home-container">
      <header className="home-nav">
        <div className="home-brand" onClick={scrollToTop}>
          <img
            src="/staff-management-mark.png"
            alt="Staff Management Portal"
            className="brand-logo-img"
          />
          <span className="home-brand-title">Staff Management Portal</span>
        </div>

        <nav className="home-nav-links">
          <a href="#home" onClick={scrollToTop} className="nav-link">Home</a>
          <a href="#features" onClick={(e) => scrollToSection(e, 'features-section')} className="nav-link">Features</a>
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works-section')} className="nav-link">How It Works</a>
          <a
            href="http://localhost:8080/swagger-ui/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link nav-link-swagger"
          >
            <span>Swagger UI</span>
            <ExternalLink size={13} className="nav-swagger-icon" />
          </a>
        </nav>

        <div className="home-nav-actions">
          {currentUser ? (
            <button
              type="button"
              onClick={() => handleNav('/dashboard')}
              className="btn-nav-primary"
            >
              <LayoutDashboard size={16} />
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNav('/login')}
                className="btn-nav-login"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => handleNav('/register')}
                className="btn-nav-signup"
              >
                <UserPlus size={15} />
                <span>Get Started</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-mobile-menu-toggle"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="home-mobile-menu">
          <a href="#home" onClick={scrollToTop} className="mobile-nav-link">Home</a>
          <a href="#features" onClick={(e) => scrollToSection(e, 'features-section')} className="mobile-nav-link">Features</a>
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works-section')} className="mobile-nav-link">How It Works</a>
          <a
            href="http://localhost:8080/swagger-ui/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-nav-link mobile-nav-link-swagger"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span>Swagger UI</span>
            <ExternalLink size={13} className="nav-swagger-icon" />
          </a>
          <div className="mobile-nav-divider" />
          {currentUser ? (
            <button
              type="button"
              onClick={() => handleNav('/dashboard')}
              className="btn-mobile-primary"
            >
              <LayoutDashboard size={16} />
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <div className="mobile-nav-buttons">
              <button
                type="button"
                onClick={() => handleNav('/login')}
                className="btn-mobile-secondary"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => handleNav('/register')}
                className="btn-mobile-primary"
              >
                <UserPlus size={15} />
                <span>Get Started</span>
              </button>
            </div>
          )}
        </div>
      )}

      <section className="home-hero">
        <div className="hero-background-glow" />
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="hero-badge-icon" />
            <span>Modern Enterprise SaaS Platform</span>
          </div>

          <h1 className="hero-heading">
            Manage Your Workforce.
            <span className="hero-heading-gradient"> Simplify Your Work.</span>
          </h1>

          <p className="hero-subtitle">
            One centralized platform to manage employees, organize company information, and gain insights into your workforce.
          </p>

          <div className="hero-cta-group">
            {currentUser ? (
              <button
                type="button"
                onClick={() => handleNav('/dashboard')}
                className="btn-hero-primary"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleNav('/register')}
                  className="btn-hero-primary"
                >
                  <span>Get Started</span>
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/login')}
                  className="btn-hero-secondary"
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </button>
              </>
            )}
          </div>

          <div className="hero-trust-row">
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>Company Workspace Isolation</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>Real-Time Workforce Analytics</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>Role-Based Administrator Control</span>
            </div>
          </div>
        </div>

        <div className="hero-preview-wrapper">
          <div className="mock-window">
            <div className="mock-window-header">
              <div className="mock-window-dots">
                <span className="mock-dot dot-red" />
                <span className="mock-dot dot-yellow" />
                <span className="mock-dot dot-green" />
              </div>
              <div className="mock-url-bar">
                <span>staff-portal.app/dashboard</span>
              </div>
              <div className="mock-window-user">
                <span className="mock-user-chip">Admin Portal</span>
              </div>
            </div>

            <div className="mock-window-body">
              <div className="mock-dash-top">
                <div className="mock-dash-title-group">
                  <div className="mock-dash-title">Acme Technologies Staff Dashboard</div>
                  <div className="mock-dash-sub">Organization workforce overview and team distribution</div>
                </div>
                <div className="mock-dash-pill">Verified Workspace</div>
              </div>

              <div className="mock-stats-grid">
                <div className="mock-stat-card">
                  <div className="mock-stat-label">Total Employees</div>
                  <div className="mock-stat-value">48</div>
                  <div className="mock-stat-indicator blue">Active Workforce</div>
                </div>
                <div className="mock-stat-card">
                  <div className="mock-stat-label">Total Departments</div>
                  <div className="mock-stat-value">6</div>
                  <div className="mock-stat-indicator green">All Teams Assigned</div>
                </div>
                <div className="mock-stat-card">
                  <div className="mock-stat-label">Annual Payroll</div>
                  <div className="mock-stat-value">₹1.42 Cr</div>
                  <div className="mock-stat-indicator purple">Calculated In Real-Time</div>
                </div>
              </div>

              <div className="mock-preview-grid">
                <div className="mock-table-card">
                  <div className="mock-card-header">
                    <span>Recent Workforce Records</span>
                    <span className="mock-badge-sm">Directory</span>
                  </div>
                  <div className="mock-table-rows">
                    <div className="mock-row">
                      <div className="mock-row-cell main">
                        <div className="mock-avatar">RS</div>
                        <span>Rahul Sharma</span>
                      </div>
                      <div className="mock-row-cell"><span className="mock-dept-badge">Engineering</span></div>
                      <div className="mock-row-cell text-muted">Lead Architect</div>
                    </div>
                    <div className="mock-row">
                      <div className="mock-row-cell main">
                        <div className="mock-avatar alt">PP</div>
                        <span>Priya Patel</span>
                      </div>
                      <div className="mock-row-cell"><span className="mock-dept-badge">Product</span></div>
                      <div className="mock-row-cell text-muted">Senior PM</div>
                    </div>
                    <div className="mock-row">
                      <div className="mock-row-cell main">
                        <div className="mock-avatar alt2">AK</div>
                        <span>Ankit Kumar</span>
                      </div>
                      <div className="mock-row-cell"><span className="mock-dept-badge">Operations</span></div>
                      <div className="mock-row-cell text-muted">Operations Lead</div>
                    </div>
                  </div>
                </div>

                <div className="mock-distribution-card">
                  <div className="mock-card-header">
                    <span>Department Distribution</span>
                    <span className="mock-badge-sm">Allocations</span>
                  </div>
                  <div className="mock-dist-bars">
                    <div className="mock-dist-item">
                      <div className="mock-dist-info">
                        <span>Engineering</span>
                        <span>42%</span>
                      </div>
                      <div className="mock-bar-track">
                        <div className="mock-bar-fill" style={{ width: '42%' }} />
                      </div>
                    </div>
                    <div className="mock-dist-item">
                      <div className="mock-dist-info">
                        <span>Product & Design</span>
                        <span>30%</span>
                      </div>
                      <div className="mock-bar-track">
                        <div className="mock-bar-fill green" style={{ width: '30%' }} />
                      </div>
                    </div>
                    <div className="mock-dist-item">
                      <div className="mock-dist-info">
                        <span>Operations</span>
                        <span>28%</span>
                      </div>
                      <div className="mock-bar-track">
                        <div className="mock-bar-fill purple" style={{ width: '28%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features-section" className="home-features-section">
        <div className="section-header">
          <div className="section-tag">Enterprise Capabilities</div>
          <h2 className="section-title">Everything you need to manage your workforce</h2>
          <p className="section-subtitle">
            Streamline administrative operations with dedicated tools designed for high-efficiency management.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper blue">
              <Users size={22} />
            </div>
            <h3 className="feature-title">Employee Management</h3>
            <p className="feature-description">
              Register personnel, maintain profiles, edit employment information, and handle deletions with company data isolation.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper emerald">
              <Building2 size={22} />
            </div>
            <h3 className="feature-title">Company Workspace</h3>
            <p className="feature-description">
              Establish an isolated organizational workspace with verified industry categories, business contact info, and account ownership.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper violet">
              <TrendingUp size={22} />
            </div>
            <h3 className="feature-title">Workforce Analytics</h3>
            <p className="feature-description">
              Access real-time executive insights with instant headcount aggregates, payroll calculations, and average salary metrics.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper amber">
              <Briefcase size={22} />
            </div>
            <h3 className="feature-title">Department Overview</h3>
            <p className="feature-description">
              Dedicated department directory tracking team allocations, headcounts, and organizational workforce share.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper cyan">
              <ShieldCheck size={22} />
            </div>
            <h3 className="feature-title">Secure Authentication</h3>
            <p className="feature-description">
              Multi-factor OTP validation, session protection, JWT security, and Google OAuth integration for enterprise safety.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper rose">
              <FileText size={22} />
            </div>
            <h3 className="feature-title">Employee Records</h3>
            <p className="feature-description">
              Searchable and sortable workforce directory with direct profile inspection, compensation details, and administrative controls.
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works-section" className="home-how-section">
        <div className="section-header">
          <div className="section-tag">Structured Workflow</div>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            A simple 4-step process to get your organization up and running in minutes.
          </p>
        </div>

        <div className="how-it-works-grid">
          <div className="how-step-card">
            <div className="how-step-number">01</div>
            <h3 className="how-step-title">Register your account</h3>
            <p className="how-step-desc">
              Create your administrator account with email verification and secure credential management.
            </p>
          </div>

          <div className="how-step-card">
            <div className="how-step-number">02</div>
            <h3 className="how-step-title">Create your company workspace</h3>
            <p className="how-step-desc">
              Define your organization profile, industry sector, and verified administrative contact details.
            </p>
          </div>

          <div className="how-step-card">
            <div className="how-step-number">03</div>
            <h3 className="how-step-title">Add and manage employees</h3>
            <p className="how-step-desc">
              Populate your workforce directory with designations, departments, contact info, and salaries.
            </p>
          </div>

          <div className="how-step-card">
            <div className="how-step-number">04</div>
            <h3 className="how-step-title">Monitor workforce information</h3>
            <p className="how-step-desc">
              Access real-time analytics, track department headcounts, and manage team updates seamlessly.
            </p>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-brand-column">
            <div className="footer-brand" onClick={scrollToTop}>
              <img
                src="/staff-management-logo.png"
                alt="Staff Management Portal"
                className="footer-full-logo"
              />
            </div>
            <p className="footer-desc">
              A modern enterprise workforce management platform built to simplify employee administration and deliver real-time operational clarity.
            </p>
          </div>

          <div className="footer-links-group">
            <div className="footer-links-col">
              <h4 className="footer-col-title">Platform</h4>
              <a href="#features" onClick={(e) => scrollToSection(e, 'features-section')} className="footer-link">Features</a>
              <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works-section')} className="footer-link">How It Works</a>
            </div>

            <div className="footer-links-col">
              <h4 className="footer-col-title">Access</h4>
              <button type="button" onClick={() => handleNav('/login')} className="footer-link-btn">Sign In</button>
              <button type="button" onClick={() => handleNav('/register')} className="footer-link-btn">Create Account</button>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>&copy; {new Date().getFullYear()} Staff Management Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
