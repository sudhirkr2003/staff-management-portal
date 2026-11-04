import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Edit2 } from 'lucide-react';
import { getEmployeeById } from '../services/employeeService';

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

const EmployeeDetailPage = ({ employeeId, onNavigate }) => {
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!employeeId) {
      setLoadError('No employee ID provided.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setLoadError('');
    getEmployeeById(employeeId)
      .then((res) => {
        if (res && res.success && res.data) {
          setEmployee(res.data);
        } else {
          setLoadError('Employee not found.');
        }
      })
      .catch(() => {
        setLoadError('Failed to load employee details. Please try again.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [employeeId]);

  return (
    <div className="edit-employee-page-wrapper">
      <div className="edit-employee-card">
        {isLoading && (
          <div className="table-loading-state">
            <Loader2 size={18} className="spinner" />
            <span>Loading employee details...</span>
          </div>
        )}

        {loadError && !isLoading && (
          <div className="alert alert-error compact-alert">
            <AlertCircle size={16} />
            <span>{loadError}</span>
          </div>
        )}

        {!isLoading && !loadError && employee && (
          <>
            <div className="emp-details-modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="emp-details-title-group">
                <h2 className="emp-details-modal-title">Employee Details</h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(`/employees/${employeeId}/edit`)}
                className="btn-emp-edit-compact"
                title="Edit Employee"
                aria-label="Edit Employee"
              >
                <Edit2 size={16} />
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
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
