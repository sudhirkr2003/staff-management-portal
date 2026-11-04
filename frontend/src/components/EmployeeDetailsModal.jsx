import React from 'react';

const formatIndianCurrency = (amount) => {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const formatJoiningDate = (dateStr) => {
  if (!dateStr) return 'Not provided';
  try {
    const raw = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr);
    const parts = raw.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const EmployeeDetailsModal = ({ employee, onClose }) => {
  if (!employee) return null;

  return (
    <div className="employee-modal-overlay">
      <div className="emp-details-modal-card">
        <div className="emp-details-modal-header">
          <div className="emp-details-title-group">
            <h2 className="emp-details-modal-title">Employee Details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-modal-close"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="emp-details-body">
          <div className="emp-profile-header-card">
            <div className="emp-avatar-circle">
              {employee.fullName ? employee.fullName.slice(0, 2).toUpperCase() : 'EM'}
            </div>
            <div className="emp-profile-meta">
              <h3 className="emp-profile-name">{employee.fullName}</h3>
              <div className="emp-profile-badges">
                <span className="dept-tag">{employee.department}</span>
                <span className="badge-role user">{employee.designation}</span>
              </div>
            </div>
          </div>

          <div className="emp-details-grid">
            <div className="emp-detail-row">
              <span className="emp-detail-label">Employee Name:</span>
              <span className="emp-detail-value">{employee.fullName}</span>
            </div>

            <div className="emp-detail-row">
              <span className="emp-detail-label">Email Address:</span>
              <span className="emp-detail-value">
                <a href={`mailto:${employee.email}`} className="emp-text-link">
                  {employee.email}
                </a>
              </span>
            </div>

            <div className="emp-detail-row">
              <span className="emp-detail-label">Phone Number:</span>
              <span className="emp-detail-value">{employee.phone || 'Not provided'}</span>
            </div>

            <div className="emp-detail-row">
              <span className="emp-detail-label">Department:</span>
              <span className="emp-detail-value">{employee.department}</span>
            </div>

            <div className="emp-detail-row">
              <span className="emp-detail-label">Designation:</span>
              <span className="emp-detail-value">{employee.designation}</span>
            </div>

            <div className="emp-detail-row">
              <span className="emp-detail-label">Salary:</span>
              <span className="emp-detail-value emp-salary-highlight">
                {formatIndianCurrency(employee.salary)}
              </span>
            </div>

            <div className="emp-detail-row full-width">
              <span className="emp-detail-label">Joining Date:</span>
              <span className="emp-detail-value">{formatJoiningDate(employee.joiningDate)}</span>
            </div>
          </div>
        </div>

        <div className="emp-details-modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-emp-details-close"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
