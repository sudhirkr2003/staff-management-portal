import React from 'react';
import { FileQuestion, ArrowLeft, LogIn, LayoutDashboard } from 'lucide-react';

const NotFoundPage = ({ onNavigate, isAuthenticated = false }) => {
  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-icon-badge">
          <FileQuestion size={40} />
        </div>
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-description">
          The page you are looking for doesn't exist, has been removed, or the URL may be incorrect.
        </p>

        <div className="not-found-actions">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => onNavigate('DASHBOARD')}
              className="btn-primary compact-btn not-found-btn"
            >
              <LayoutDashboard size={16} />
              <span>Go to Dashboard</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('LOGIN')}
              className="btn-primary compact-btn not-found-btn"
            >
              <LogIn size={16} />
              <span>Go to Login</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('HOME')}
            className="btn-secondary compact-btn-secondary not-found-btn"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;

