import React, { useState, useEffect } from 'react';
import { Mail, Lock, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { forgotPassword, resendResetOtp, verifyResetOtp, resetPassword } from '../services/authService';

const ForgotPassword = ({ initialEmail = '', onSuccess, onCancel }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const emailErr = validateEmail(email);
    if (emailErr) {
      setFieldErrors({ email: emailErr });
      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      setStep(2);
      setCooldown(60);
      setInfoMessage('If your email is registered, a 6-digit OTP has been sent.');
      setFieldErrors({});
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMessage(err.response.data.message || 'Failed to send OTP. Please try again.');
      } else {
        setErrorMessage('Unable to connect to the server. Please verify your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isSubmitting) return;

    setErrorMessage('');
    setInfoMessage('');
    setIsSubmitting(true);

    try {
      await resendResetOtp({ email: email.trim().toLowerCase() });
      setCooldown(60);
      setInfoMessage('A new 6-digit OTP has been sent to your email.');
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMessage(err.response.data.message || 'Failed to resend OTP.');
      } else {
        setErrorMessage('Unable to connect to the server. Please verify your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!otp.trim()) {
      setFieldErrors({ otp: 'OTP is required' });
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setFieldErrors({ otp: 'OTP must be exactly 6 digits' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim()
      });

      if (response.success && response.data && response.data.resetToken) {
        setResetToken(response.data.resetToken);
        setStep(3);
        setFieldErrors({});
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMessage(err.response.data.message || 'Invalid or expired OTP.');
      } else {
        setErrorMessage('Unable to connect to the server. Please verify your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const passErr = validatePassword(newPassword);
    const confirmErr = validateConfirmPassword(confirmPassword, newPassword);

    if (passErr || confirmErr) {
      setFieldErrors({
        newPassword: passErr,
        confirmPassword: confirmErr
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        resetToken: resetToken,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      });

      if (response.success) {
        setSuccessMessage('Password reset successfully.');
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

  return (
    <div className="card-container login-card">
      <div className="card-header auth-header">
        <h1 className="card-title auth-title">
          {step === 1 && 'Forgot Password'}
          {step === 2 && 'Verify OTP'}
          {step === 3 && 'Reset Password'}
        </h1>
        <p className="card-subtitle compact-subtitle">
          {step === 1 && 'Enter your registered email address to receive an OTP.'}
          {step === 2 && `Enter the 6-digit OTP sent to ${email}`}
          {step === 3 && 'Create a new secure password for your account.'}
        </p>
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

      {infoMessage && (
        <div className="alert alert-info compact-alert">
          <span>{infoMessage}</span>
        </div>
      )}

      {step === 1 && (
        <form onSubmit={handleSendOtp} noValidate className="form-content compact-form">
          <div className="form-group compact-group">
            <label htmlFor="forgot-email" className="form-label compact-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                id="forgot-email"
                name="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                  if (fieldErrors.email) setFieldErrors({});
                }}
                disabled={isSubmitting}
                className={`form-input compact-input ${fieldErrors.email ? 'input-error' : ''}`}
              />
            </div>
            {fieldErrors.email && <p className="error-text compact-error">{fieldErrors.email}</p>}
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

          <div className="card-footer-nav">
            <p className="footer-nav-text">
              Remember your password?{' '}
              <button
                type="button"
                onClick={onCancel}
                className="footer-nav-link"
              >
                Back to Login
              </button>
            </p>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} noValidate className="form-content compact-form">
          <div className="form-group compact-group">
            <label htmlFor="reset-otp" className="form-label compact-label">
              6-Digit OTP
            </label>
            <div className="input-wrapper">
              <KeyRound size={16} className="input-icon" />
              <input
                type="text"
                id="reset-otp"
                name="otp"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setOtp(val);
                  setErrorMessage('');
                  if (fieldErrors.otp) setFieldErrors({});
                }}
                disabled={isSubmitting}
                className={`form-input compact-input ${fieldErrors.otp ? 'input-error' : ''}`}
              />
            </div>
            {fieldErrors.otp && <p className="error-text compact-error">{fieldErrors.otp}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary compact-btn">
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify OTP</span>
            )}
          </button>

          <div className="card-footer-nav">
            <p className="footer-nav-text">
              Didn't receive the OTP?{' '}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || isSubmitting}
                className={`footer-nav-link ${cooldown > 0 ? 'text-muted-link' : ''}`}
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
              </button>
            </p>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setOtp('');
                setErrorMessage('');
                setInfoMessage('');
              }}
              className="btn-back-home"
            >
              <ArrowLeft size={14} />
              <span>Change Email</span>
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} noValidate className="form-content compact-form">
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
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;

