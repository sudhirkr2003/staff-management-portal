import React, { useMemo } from 'react';
import { Building2, Users, Loader2, AlertCircle } from 'lucide-react';

const DepartmentsPage = ({
  employees = [],
  isLoading = false,
  error = '',
  onRetry,
  onNavigate,
  companyName = ''
}) => {
  const departments = useMemo(() => {
    if (!employees || employees.length === 0) return [];
    const total = employees.length;
    const map = {};

    employees.forEach((emp) => {
      const name = emp.department ? emp.department.trim() : 'Unassigned';
      if (!map[name]) {
        map[name] = 0;
      }
      map[name] += 1;
    });

    return Object.entries(map)
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [employees]);

  const totalEmployees = employees ? employees.length : 0;

  return (
    <div className="departments-page-wrapper">
      <div className="departments-content-header">
        <div>
          <h1 className="content-title">All Departments</h1>
          <p className="content-subtitle">
            {companyName
              ? `Departments and workforce distribution for ${companyName}.`
              : 'Overview of all company departments and employee headcounts.'}
          </p>
        </div>
        {!isLoading && !error && departments.length > 0 && (
          <div className="departments-summary-badge">
            <span className="summary-number">{departments.length}</span>
            <span className="summary-label">{departments.length === 1 ? 'Department' : 'Departments'}</span>
            <span className="summary-separator">•</span>
            <span className="summary-number">{totalEmployees}</span>
            <span className="summary-label">{totalEmployees === 1 ? 'Employee' : 'Employees'}</span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="table-loading-state" style={{ minHeight: '220px' }}>
          <Loader2 size={22} className="spinner" />
          <span>Loading departments...</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-error compact-alert" style={{ marginBottom: '1.25rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn-alert-retry"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && departments.length === 0 && (
        <div className="table-empty-notice" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '3.5rem 1.5rem' }}>
          <Building2 size={36} className="empty-state-icon" style={{ color: '#94a3b8' }} />
          <div className="empty-state-title" style={{ marginTop: '0.5rem' }}>
            No Departments Found
          </div>
          <div className="empty-state-desc" style={{ maxWidth: '420px', margin: '0.25rem auto 1rem' }}>
            There are no departments recorded in your company yet. Add employees with assigned departments to populate this directory.
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/employees/new')}
            className="btn-new-employee"
          >
            <span>Add Employee</span>
          </button>
        </div>
      )}

      {!isLoading && !error && departments.length > 0 && (
        <div className="departments-grid">
          {departments.map((dept) => (
            <div key={dept.name} className="department-card">
              <div className="department-card-header">
                <div className="department-icon-badge">
                  <Building2 size={20} />
                </div>
                <div className="department-badge-percentage">
                  {dept.percentage}% of workforce
                </div>
              </div>

              <div className="department-card-body">
                <h3 className="department-card-name" title={dept.name}>{dept.name}</h3>
                <div className="department-card-count-row">
                  <div className="department-count-badge">
                    <Users size={14} />
                    <span>{dept.count} {dept.count === 1 ? 'Employee' : 'Employees'}</span>
                  </div>
                </div>

                <div className="dept-dist-bar-track" style={{ marginTop: '0.85rem' }}>
                  <div
                    className="dept-dist-bar-fill"
                    style={{ width: `${dept.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DepartmentsPage;
