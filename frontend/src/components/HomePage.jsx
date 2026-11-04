import React from 'react';
import { Shield, KeyRound, Users, Database, SlidersHorizontal, ArrowRight, LogIn, UserPlus } from 'lucide-react';

const HomePage = ({ onNavigate, currentUser }) => {
  const scrollToAbout = (e) => {
    e.preventDefault();
    const element = document.getElementById('about-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="home-container">
      <header className="home-nav">
        <div className="home-brand" onClick={scrollToTop}>
          <div className="brand-logo-icon">
            <Users size={22} />
          </div>
          <span className="home-brand-title">Staff Management Portal</span>
        </div>

        <nav className="home-nav-links">
          <a href="#home" onClick={scrollToTop} className="nav-link">Home</a>
          <a href="#about" onClick={scrollToAbout} className="nav-link">About</a>
        </nav>

        <div className="home-nav-actions">
          {currentUser ? (
            <button
              type="button"
              onClick={() => onNavigate('WELCOME')}
              className="btn-nav-login"
            >
              <Users size={16} />
              <span>Dashboard</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('LOGIN')}
                className="btn-nav-login"
              >
                <LogIn size={16} />
                <span>Login</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('REGISTER')}
                className="btn-nav-signup"
              >
                <UserPlus size={16} />
                <span>Sign Up</span>
              </button>
            </>
          )}
        </div>
      </header>

      <section className="home-hero">
        <div className="hero-content">
          <div className="hero-badge">Enterprise Management Solution</div>
          <h1 className="hero-heading">Staff Management Portal</h1>
          <p className="hero-subtitle">
            A smarter and more secure way to manage your organization's workforce.
          </p>

          <div className="hero-cta-group">
            {currentUser ? (
              <button
                type="button"
                onClick={() => onNavigate('WELCOME')}
                className="btn-hero-primary"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('REGISTER')}
                  className="btn-hero-primary"
                >
                  <span>Get Started</span>
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('LOGIN')}
                  className="btn-hero-secondary"
                >
                  <span>Login</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section id="about-section" className="home-about-section">
        <div className="about-header">
          <h2 className="section-title">About the Application</h2>
          <div className="section-divider"></div>
        </div>

        <p className="about-text">
          Staff Management Portal is a web-based application designed to simplify employee information management. It provides a centralized platform where authorized administrators can securely access and manage employee records.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Shield size={24} className="feature-icon" />
            </div>
            <h3 className="feature-title">Secure Authentication</h3>
            <p className="feature-description">
              Industry-grade password protection, cryptographic OTP verification, and stateless JWT tokens ensure high security standards.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <KeyRound size={24} className="feature-icon" />
            </div>
            <h3 className="feature-title">Multiple Authentication Methods</h3>
            <p className="feature-description">
              Flexible authentication support incorporating traditional email/password credentials and modern Google Sign-In integrations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Users size={24} className="feature-icon" />
            </div>
            <h3 className="feature-title">Employee Management</h3>
            <p className="feature-description">
              Streamlined administrative control allowing staff registration, profile tracking, dynamic updates, and record removal.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Database size={24} className="feature-icon" />
            </div>
            <h3 className="feature-title">Centralized Employee Records</h3>
            <p className="feature-description">
              A unified relational datastore with strict user-level data isolation to keep corporate personnel data organized and confidential.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <SlidersHorizontal size={24} className="feature-icon" />
            </div>
            <h3 className="feature-title">Easy Employee Information Management</h3>
            <p className="feature-description">
              An intuitive interface designed to minimize administrative friction and deliver real-time staff data operations effortlessly.
            </p>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} Staff Management Portal. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;
