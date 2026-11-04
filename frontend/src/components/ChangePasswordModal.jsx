import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft, X } from 'lucide-react';
import { changePassword } from '../services/authService';

const ChangePasswordModal = ({ user, onClose, onBackToProfile, onForgotPassword }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  const validateCurrentPassword = (password) => {
    if (!password) return 'Current password is required';
    return '';
  };

  const validateNewPassword = (password) => {
    if (!password) return 'New password is required';
    if (!passwordStrengthRegex.test(password)) {
      return 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&#).';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword, currentNewPassword) => {
    if (!confirmPassword) return 'Please confirm your new password';
    if (confirmPassword !== currentNewPassword) return 'Password is not matching.';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';

    if (name === 'currentPassword') {
      error = validateCurrentPassword(value);
    } else if (name === 'newPassword') {
      error = validateNewPassword(value);
    } else if (name === 'confirmPassword') {
      error = validateConfirmPassword(value, formData.newPassword);
    }

    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const currentError = validateCurrentPassword(formData.currentPassword);
    const newError = validateNewPassword(formData.newPassword);
    const confirmError = validateConfirmPassword(formData.confirmPassword, formData.newPassword);

    if (currentError || newError || confirmError) {
      setFieldErrors({
        currentPassword: currentError,
        newPassword: newError,
        confirmPassword: confirmError
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });

      if (response.success) {
        setSuccessMessage('Password changed successfully.');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (errorData.data && typeof errorData.data === 'object') {
          setFieldErrors((prev) => ({ ...prev, ...errorData.data }));
        }
        setErrorMessage(errorData.message || 'Failed to change password. Please try again.');
      } else {
        setErrorMessage('Unable to connect to the server. Please verify your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <Lock size={20} className="modal-icon" />
            <h2 className="modal-title">Change Password</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {successMessage && (
          <div className="alert alert-success compact-alert">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error compact-alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="form-content compact-form">
          <div className="form-group compact-group">
            <label htmlFor="current-password" className="form-label compact-label">
              Current Password
            </label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="current-password"
                name="currentPassword"
                placeholder="Enter current password"
                value={formData.currentPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`form-input compact-input ${fieldErrors.currentPassword ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="input-eye-btn"
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <p className="error-text compact-error">{fieldErrors.currentPassword}</p>
            )}
            <div className="forgot-link-row">
              <button
                type="button"
                onClick={() => onForgotPassword(user?.email || '')}
                className="forgot-password-link"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <div className="form-group compact-group">
            <label htmlFor="new-password" className="form-label compact-label">
              New Password
            </label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="new-password"
                name="newPassword"
                placeholder="Enter new password"
                value={formData.newPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`form-input compact-input ${fieldErrors.newPassword ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="input-eye-btn"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <p className="error-text compact-error">{fieldErrors.newPassword}</p>
            )}
          </div>

          <div className="form-group compact-group">
            <label htmlFor="confirm-new-password" className="form-label compact-label">
              Confirm New Password
            </label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm-new-password"
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                className={`form-input compact-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="input-eye-btn"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="error-text compact-error">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onBackToProfile}
              disabled={isSubmitting}
              className="btn-secondary compact-btn-secondary"
            >
              <ArrowLeft size={14} />
              <span>Back to Profile</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary compact-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Change Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;

