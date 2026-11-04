import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { loginUser } from '../services/authService';

const LoginPage = ({ onLoginSuccess, onNavigate }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage('');
    setInfoMessage('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'email') {
      if (!value.trim()) {
        setFieldErrors((prev) => ({ ...prev, email: 'Email address is required' }));
      } else if (!emailRegex.test(value.trim())) {
        setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      }
    } else if (name === 'password') {
      if (!value) {
        setFieldErrors((prev) => ({ ...prev, password: 'Password is required' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      if (response.success && response.data) {
        onLoginSuccess(response.data);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMessage(err.response.data.message || 'Invalid email or password.');
      } else {
        setErrorMessage('Unable to connect to the server. Please verify your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = () => {
    setInfoMessage('Google Sign-In integration is planned for an upcoming release.');
  };

  return (
    <div className="card-container login-card">
      <div className="card-header auth-header">
        <h1 className="card-title auth-title">Login</h1>
        <p className="card-subtitle compact-subtitle">
          Sign in to access your administrative workspace.
        </p>
      </div>

      {errorMessage && (
        <div className="alert alert-error compact-alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {infoMessage && (
        <div className="alert alert-info compact-alert">
          <span>{infoMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="form-content compact-form">
        <div className="form-group compact-group">
          <label htmlFor="login-email" className="form-label compact-label">
            Email Address
          </label>
          <div className="input-wrapper">
            <Mail size={16} className="input-icon" />
            <input
              type="email"
              id="login-email"
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

        <div className="form-group compact-group">
          <label htmlFor="login-password" className="form-label compact-label">
            Password
          </label>
          <div className="input-wrapper">
            <Lock size={16} className="input-icon" />
            <input
              type="password"
              id="login-password"
              name="password"
              placeholder="Enter Your Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isSubmitting}
              className={`form-input compact-input ${fieldErrors.password ? 'input-error' : ''}`}
            />
          </div>
          {fieldErrors.password && <p className="error-text compact-error">{fieldErrors.password}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary compact-btn">
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="spinner" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Login</span>
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
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('REGISTER')}
              className="footer-nav-link"
            >
              Sign Up
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

export default LoginPage;
