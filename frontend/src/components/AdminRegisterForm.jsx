import React, { useState } from 'react';
import { User, Mail, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { registerAdmin } from '../services/authService';

const AdminRegisterForm = ({ onOtpSent, onNavigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateName = (name) => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Full name must be at least 2 characters';
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email address is required';
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (!passwordStrengthRegex.test(password)) {
      return 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&#).';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPassword, currentPassword) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== currentPassword) return 'Password is not matching.';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setGeneralError('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';

    if (name === 'fullName') {
      error = validateName(value);
    } else if (name === 'email') {
      error = validateEmail(value);
    } else if (name === 'password') {
      error = validatePassword(value);
    } else if (name === 'confirmPassword') {
      error = validateConfirmPassword(value, formData.password);
    }

    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const { name, value } = e.target;
      if (name === 'password') {
        const error = validatePassword(value);
        setFieldErrors((prev) => ({ ...prev, password: error }));
      } else if (name === 'confirmPassword') {
        const error = validateConfirmPassword(value, formData.password);
        setFieldErrors((prev) => ({ ...prev, confirmPassword: error }));
      }
    }
  };

  const validateAll = () => {
    const errors = {
      fullName: validateName(formData.fullName),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password)
    };

    setFieldErrors(errors);
    return !Object.values(errors).some((error) => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerAdmin({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.success) {
        onOtpSent(formData.email.trim().toLowerCase());
      }
    } catch (err) {
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (errorData.data && typeof errorData.data === 'object') {
          setFieldErrors((prev) => ({ ...prev, ...errorData.data }));
        }
        setGeneralError(errorData.message || 'Failed to register admin. Please try again.');
      } else {
        setGeneralError('Unable to connect to the server. Please verify your connection.');
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
    <div className="card-container registration-card">
      <div className="card-header auth-header">
        <h1 className="card-title auth-title">Admin Registration</h1>
      </div>

      {generalError && (
        <div className="alert alert-error compact-alert">
          <AlertCircle size={16} />
          <span>{generalError}</span>
        </div>
      )}

      {infoMessage && (
        <div className="alert alert-info compact-alert">
          <span>{infoMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="form-content compact-form">
        <div className="form-group compact-group">
          <label htmlFor="reg-fullName" className="form-label compact-label">
            Full Name
          </label>
          <div className="input-wrapper">
            <User size={16} className="input-icon" />
            <input
              type="text"
              id="reg-fullName"
              name="fullName"
              placeholder="Enter Your Name"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`form-input compact-input ${fieldErrors.fullName ? 'input-error' : ''}`}
            />
          </div>
          {fieldErrors.fullName && <p className="error-text compact-error">{fieldErrors.fullName}</p>}
        </div>

        <div className="form-group compact-group">
          <label htmlFor="reg-email" className="form-label compact-label">
            Email Address
          </label>
          <div className="input-wrapper">
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              id="reg-email"
              name="email"
              placeholder="Enter Your Email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`form-input compact-input ${fieldErrors.email ? 'input-error' : ''}`}
            />
          </div>
          {fieldErrors.email && <p className="error-text compact-error">{fieldErrors.email}</p>}
        </div>

        <div className="form-row">
          <div className="form-group compact-group">
            <label htmlFor="reg-password" className="form-label compact-label">
              Password
            </label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                id="reg-password"
                name="password"
                placeholder="Enter Your Password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                className={`form-input compact-input ${fieldErrors.password ? 'input-error' : ''}`}
              />
            </div>
            {fieldErrors.password && <p className="error-text compact-error">{fieldErrors.password}</p>}
          </div>

          <div className="form-group compact-group">
            <label htmlFor="reg-confirmPassword" className="form-label compact-label">
              Confirm Password
            </label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                id="reg-confirmPassword"
                name="confirmPassword"
                placeholder="Confirm Your Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                disabled={isSubmitting}
                className={`form-input compact-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
              />
            </div>
            {fieldErrors.confirmPassword && <p className="error-text compact-error">{fieldErrors.confirmPassword}</p>}
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary compact-btn">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="spinner" />
              <span>Sending OTP...</span>
            </>
          ) : (
            <span>Send OTP</span>
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
          className="btn-google compact-btn"
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
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('LOGIN')}
              className="footer-nav-link"
            >
              Login
            </button>
          </p>

          <button
            type="button"
            onClick={() => onNavigate('HOME')}
            className="btn-back-home"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminRegisterForm;
