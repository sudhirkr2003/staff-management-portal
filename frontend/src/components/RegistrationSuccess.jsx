import React from 'react';
import { CheckCircle2, Shield, LogIn } from 'lucide-react';

const RegistrationSuccess = ({ onProceedToLogin }) => {
  return (
    <div className="card-container compact-card text-center">
      <div className="success-badge-wrapper compact-success-badge">
        <div className="success-icon-badge compact-success-icon-badge">
          <CheckCircle2 size={32} className="success-icon" />
        </div>
      </div>

      <h1 className="card-title compact-title">Registration Successful</h1>
      <p className="card-subtitle compact-subtitle">
        Your administrator account has been created in the database.
      </p>

      <div className="info-box compact-info-box">
        <div className="info-box-header">
          <Shield size={16} className="info-icon" />
          <h3 className="info-title compact-info-title">Account Status: Active (ADMIN)</h3>
        </div>
        <p className="info-description compact-info-desc">
          Administrative privileges have been assigned to your account.
        </p>
      </div>

      <div className="login-notice-card compact-notice-card">
        <h4 className="notice-heading compact-notice-heading">Next Steps</h4>
        <p className="notice-body compact-notice-body">
          You may now proceed to sign in with your verified administrator credentials.
        </p>
      </div>

      <div className="success-actions">
        <button
          type="button"
          onClick={onProceedToLogin}
          className="btn-primary compact-btn"
        >
          <LogIn size={16} />
          <span>Proceed to Login</span>
        </button>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
