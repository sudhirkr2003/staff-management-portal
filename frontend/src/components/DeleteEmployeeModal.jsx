import React from 'react';
import { AlertCircle, Loader2, Trash2 } from 'lucide-react';

const DeleteEmployeeModal = ({
  employee,
  onCancel,
  onConfirm,
  isDeleting,
  error
}) => {
  if (!employee) return null;

  return (
    <div className="employee-modal-overlay">
      <div className="delete-modal-card">
        <div className="delete-modal-header">
          <div className="delete-modal-icon-badge">
            <Trash2 size={22} />
          </div>
          <div className="delete-modal-title-group">
            <h3 className="delete-modal-title">Delete Employee?</h3>
            <p className="delete-modal-subtitle">
              Are you sure you want to delete this employee?
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error compact-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="delete-modal-details-box">
          <div className="delete-modal-detail-row">
            <span className="delete-detail-label">Employee Name:</span>
            <span className="delete-detail-value">{employee.fullName}</span>
          </div>
          <div className="delete-modal-detail-row">
            <span className="delete-detail-label">Email:</span>
            <span className="delete-detail-value">{employee.email}</span>
          </div>
        </div>

        <p className="delete-modal-warning-text">
          This action will remove the employee from your active employee directory.
        </p>

        <div className="delete-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="btn-delete-cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn-delete-confirm"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Deleting Employee...</span>
              </>
            ) : (
              <span>Delete Employee</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEmployeeModal;

