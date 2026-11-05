import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { resetPassword } from '../services/authService';

const ForgotPassword = ({ initialEmail = '', onSuccess, onCancel }) => {
  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  const validateEmail = (val) => {
    if (!val.trim()) return 'Email address is required';
    if (!emailRegex.test(val.trim())) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (pass) => {
    if (!pass) return 'New password is required';
    if (!passwordStrengthRegex.test(pass)) {
      return 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&#).';
    }
    return '';
  };

  const validateConfirmPassword = (confirm, pass) => {
    if (!confirm) return 'Please confirm your password';
    if (confirm !== pass) return 'Password is not matching.';
    return '';
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const emailErr = validateEmail(email);
    const passErr = validatePassword(newPassword);
    const confirmErr = validateConfirmPassword(confirmPassword, newPassword);

    if (emailErr || passErr || confirmErr) {
      setFieldErrors({
        email: emailErr,
        newPassword: passErr,
        confirmPassword: confirmErr
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        email: email.trim().toLowerCase(),
        newPassword: newPassword,
        confirmPassword: confirmPassword
      });

      if (response.success) {
        setSuccessMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMessage(err.response.data.message || 'Failed to reset password. Please try again.');
      } else {
        setErrorMessage('Unable to connect to the server. Please verify your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    window.location.href = `${apiBase}/oauth2/authorization/google`;
  };

  return (
    <div className="card-container login-card">
      <div className="card-header auth-header">
        <h1 className="card-title auth-title">Reset Password</h1>
        <p className="card-subtitle compact-subtitle">
          Enter your registered email and new password to reset your credentials.
        </p>
      </div>

      {errorMessage && (
        <div className="alert alert-error compact-alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success compact-alert">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleResetPassword} noValidate className="form-content compact-form">
        <div className="form-group compact-group">
          <label htmlFor="reset-email" className="form-label compact-label">
            Email Address
          </label>
          <div className="input-wrapper">
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              id="reset-email"
              name="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage('');
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
              }}
              disabled={isSubmitting}
              className={`form-input compact-input ${fieldErrors.email ? 'input-error' : ''}`}
            />
          </div>
          {fieldErrors.email && <p className="error-text compact-error">{fieldErrors.email}</p>}
        </div>

        <div className="form-group compact-group">
          <label htmlFor="reset-new-password" className="form-label compact-label">
            New Password
          </label>
          <div className="input-wrapper">
            <Lock size={16} className="input-icon" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="reset-new-password"
              name="newPassword"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrorMessage('');
                if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
              }}
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
          {fieldErrors.newPassword && <p className="error-text compact-error">{fieldErrors.newPassword}</p>}
        </div>

        <div className="form-group compact-group">
          <label htmlFor="reset-confirm-password" className="form-label compact-label">
            Confirm New Password
          </label>
          <div className="input-wrapper">
            <Lock size={16} className="input-icon" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="reset-confirm-password"
              name="confirmPassword"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMessage('');
                if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
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
          {fieldErrors.confirmPassword && <p className="error-text compact-error">{fieldErrors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary compact-btn">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="spinner" />
              <span>Resetting Password...</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </button>

        <div className="divider-container">
          <span className="divider-line"></span>
          <span className="divider-text">OR</span>
          <span className="divider-line"></span>
        </div>

        <button
          type="button"
          onClick={handleGoogleClick}
          className="btn-google"
        >
          <svg className="google-icon" width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="card-footer-nav">
          <p className="footer-nav-text">
            Remember your password?{' '}
            <button
              type="button"
              onClick={onCancel}
              className="footer-nav-link"
            >
              Login
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
