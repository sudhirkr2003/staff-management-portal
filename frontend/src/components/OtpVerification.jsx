import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, RefreshCw, AlertCircle, CheckCircle2, ArrowLeft, Loader2, Clock } from 'lucide-react';
import { verifyOtp, resendOtp } from '../services/authService';

const OtpVerification = ({ email, onVerified, onBack }) => {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('OTP dispatched to your email.');

  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (otpExpirySeconds <= 0) return;
    const interval = setInterval(() => {
      setOtpExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpExpirySeconds]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setErrorMessage('');

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const splitDigits = pastedData.split('');
      setOtpDigits(splitDigits);
      setErrorMessage('');
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the OTP.');
      return;
    }

    if (otpExpirySeconds <= 0) {
      setErrorMessage('OTP has expired. Please request a new OTP using Resend.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const response = await verifyOtp({
        email: email,
        otp: fullOtp
      });

      if (response.success) {
        onVerified();
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMessage(err.response.data.message || 'Verification failed. Please check your OTP.');
      } else {
        setErrorMessage('Unable to connect to the server. Please verify your connection.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isResending || isVerifying) return;

    setIsResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await resendOtp({ email });
      if (response.success) {
        setSuccessMessage('A fresh 6-digit OTP has been sent.');
        setOtpDigits(['', '', '', '', '', '']);
        setOtpExpirySeconds(300);
        setCooldownSeconds(60);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setErrorMessage(err.response.data.message || 'Failed to resend OTP.');
      } else {
        setErrorMessage('Unable to contact the server to resend OTP.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isOtpComplete = otpDigits.every((d) => d !== '');

  return (
    <div className="card-container compact-card">
      <div className="card-header compact-header">
        <div className="icon-badge compact-badge">
          <Mail size={20} className="badge-icon" />
        </div>
        <h1 className="card-title compact-title">Verify Email OTP</h1>
        <p className="card-subtitle compact-subtitle">
          Code dispatched to:
        </p>
        <p className="highlight-email compact-email">{email}</p>
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

      <form onSubmit={handleVerify} className="form-content compact-form">
        <div className="otp-container compact-otp" onPaste={handlePaste}>
          {otpDigits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={isVerifying || isResending}
              className={`otp-box compact-box ${digit ? 'filled' : ''}`}
            />
          ))}
        </div>

        <div className="status-meta compact-meta">
          <div className="meta-item">
            <Clock size={14} />
            <span>
              Expires in:{' '}
              <strong className={otpExpirySeconds < 60 ? 'text-danger' : 'text-primary'}>
                {formatTime(otpExpirySeconds)}
              </strong>
            </span>
          </div>
          {cooldownSeconds > 0 && (
            <div className="meta-item text-muted">
              <span>Resend in: {cooldownSeconds}s</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!isOtpComplete || isVerifying || isResending || otpExpirySeconds <= 0}
          className="btn-primary compact-btn"
        >
          {isVerifying ? (
            <>
              <Loader2 size={16} className="spinner" />
              <span>Verifying OTP...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>Verify & Activate Admin</span>
            </>
          )}
        </button>

        <div className="actions-footer compact-footer-actions">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldownSeconds > 0 || isResending || isVerifying}
            className="btn-secondary compact-btn-secondary"
          >
            {isResending ? (
              <>
                <Loader2 size={14} className="spinner" />
                <span>Resending...</span>
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                <span>Resend OTP {cooldownSeconds > 0 ? `(${cooldownSeconds}s)` : ''}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={isVerifying || isResending}
            className="btn-link compact-btn-link"
          >
            <ArrowLeft size={14} />
            <span>Change Details</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default OtpVerification;
