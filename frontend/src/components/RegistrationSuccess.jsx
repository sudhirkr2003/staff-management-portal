import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

const RegistrationSuccess = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="card-container compact-card text-center">
      <div className="success-badge-wrapper compact-success-badge">
        <div className="success-icon-badge compact-success-icon-badge" style={{ backgroundColor: '#ecfdf5', color: '#10b981' }}>
          <CheckCircle2 size={48} className="success-icon" style={{ color: '#10b981' }} />
        </div>
      </div>

      <h1 className="card-title compact-title" style={{ marginTop: '1rem' }}>Registration Successful</h1>
      <p className="card-subtitle compact-subtitle">
        Redirecting to company setup...
      </p>
    </div>
  );
};

export default RegistrationSuccess;
