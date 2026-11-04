import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import AdminRegisterForm from './components/AdminRegisterForm';
import OtpVerification from './components/OtpVerification';
import RegistrationSuccess from './components/RegistrationSuccess';
import WelcomePage from './components/WelcomePage';
import ForgotPassword from './components/ForgotPassword';
import { getStoredUser, getStoredToken, logoutUser, getProfile } from './services/authService';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import './App.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('HOME');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [googleRegData, setGoogleRegData] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [isOAuthError, setIsOAuthError] = useState(false);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [backendConnectionError, setBackendConnectionError] = useState(false);

  const verifySession = useCallback(async (token, fallbackUser) => {
    try {
      const response = await getProfile();
      if (response && response.success && response.data) {
        localStorage.setItem('auth_user', JSON.stringify(response.data));
        setCurrentUser(response.data);
        setBackendConnectionError(false);
        setCurrentPage('WELCOME');
      }
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        logoutUser();
        setCurrentUser(null);
        setBackendConnectionError(false);
        setLoginError('Your session has expired. Please sign in again.');
        setCurrentPage('LOGIN');
      } else {
        setBackendConnectionError(true);
        if (fallbackUser) {
          setCurrentUser(fallbackUser);
          setCurrentPage('WELCOME');
        }
      }
    } finally {
      setIsRestoringSession(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    if (status === 'login_success') {
      const token = params.get('token');
      if (token) {
        localStorage.setItem('auth_token', token);
        window.history.replaceState({}, document.title, window.location.pathname);
        verifySession(token, null);
        return;
      }
    } else if (status === 'google_register') {
      const regToken = params.get('regToken');
      const email = params.get('email');
      const fullName = params.get('fullName');
      window.history.replaceState({}, document.title, window.location.pathname);
      setGoogleRegData({ regToken, email: email || '', fullName: fullName || '' });
      setIsOAuthError(false);
      setIsRestoringSession(false);
      setCurrentPage('LOGIN');
      return;
    } else if (status === 'error') {
      const errorType = params.get('errorType');
      const rawMessage = params.get('message') || '';
      window.history.replaceState({}, document.title, window.location.pathname);

      let friendlyMessage = 'Google sign-in could not be completed. Please try again.';
      const lowerRaw = rawMessage.toLowerCase();
      if (
        errorType === 'network' ||
        lowerRaw.includes('unexpected end of file') ||
        lowerRaw.includes('i/o error') ||
        lowerRaw.includes('connect') ||
        lowerRaw.includes('network') ||
        lowerRaw.includes('unreachable') ||
        lowerRaw.includes('broken pipe')
      ) {
        friendlyMessage = 'Unable to connect to Google. Please check your internet connection and try again.';
      } else if (errorType === 'timeout' || lowerRaw.includes('timeout') || lowerRaw.includes('timed out')) {
        friendlyMessage = 'Something went wrong. Please try again.';
      } else if (errorType === 'auth') {
        friendlyMessage = 'Google sign-in could not be completed. Please try again.';
      }

      setLoginError(friendlyMessage);
      setIsOAuthError(true);
      setIsRestoringSession(false);
      setCurrentPage('LOGIN');
      return;
    }

    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    if (storedToken) {
      if (storedUser) {
        setCurrentUser(storedUser);
      }
      verifySession(storedToken, storedUser);
    } else {
      setIsRestoringSession(false);
      setCurrentPage('HOME');
    }
  }, [verifySession]);

  useEffect(() => {
    let intervalId;
    if (backendConnectionError && getStoredToken()) {
      intervalId = setInterval(() => {
        getProfile()
          .then((response) => {
            if (response && response.success && response.data) {
              localStorage.setItem('auth_user', JSON.stringify(response.data));
              setCurrentUser(response.data);
              setBackendConnectionError(false);
              setCurrentPage('WELCOME');
            }
          })
          .catch((err) => {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
              logoutUser();
              setCurrentUser(null);
              setBackendConnectionError(false);
              setLoginError('Your session has expired. Please sign in again.');
              setCurrentPage('LOGIN');
            }
          });
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [backendConnectionError]);

  const handleManualReconnect = async () => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token) {
      await verifySession(token, user);
    }
  };

  const handleNavigate = (page) => {
    if (page === 'LOGIN' && currentUser && getStoredToken()) {
      setCurrentPage('WELCOME');
      return;
    }
    setLoginError('');
    setIsOAuthError(false);
    setLoginSuccessMessage('');
    if (page !== 'LOGIN') {
      setGoogleRegData(null);
    }
    setCurrentPage(page);
  };

  const handleOtpSent = (email) => {
    setRegisteredEmail(email);
    setCurrentPage('OTP_VERIFY');
  };

  const handleOtpVerified = () => {
    setCurrentPage('SUCCESS');
  };

  const handleProceedToLogin = () => {
    setLoginError('');
    setIsOAuthError(false);
    setLoginSuccessMessage('');
    setGoogleRegData(null);
    setCurrentPage('LOGIN');
  };

  const handleLoginSuccess = (userData) => {
    setGoogleRegData(null);
    setLoginSuccessMessage('');
    setCurrentUser(userData);
    setBackendConnectionError(false);
    setCurrentPage('WELCOME');
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const handleSignOut = () => {
    logoutUser();
    setCurrentUser(null);
    setBackendConnectionError(false);
    setGoogleRegData(null);
    setCurrentPage('HOME');
  };

  const handleOpenForgotPassword = (email = '') => {
    setForgotPasswordEmail(email);
    setLoginError('');
    setLoginSuccessMessage('');
    setCurrentPage('FORGOT_PASSWORD');
  };

  const handleForgotPasswordSuccess = () => {
    logoutUser();
    setCurrentUser(null);
    setBackendConnectionError(false);
    setLoginSuccessMessage('Password reset successfully. Please sign in with your new password.');
    setCurrentPage('LOGIN');
  };

  if (isRestoringSession) {
    return (
      <div className="session-loading-container">
        <div className="session-loading-card">
          <div className="brand-logo-icon session-loading-logo">
            <Users size={28} />
          </div>
          <h2 className="session-loading-title">Staff Management Portal</h2>
          <div className="session-loading-spinner-row">
            <Loader2 size={18} className="spinner" />
            <span>Restoring session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (backendConnectionError && !currentUser) {
    return (
      <div className="session-loading-container">
        <div className="session-loading-card">
          <div className="brand-logo-icon session-loading-logo">
            <Users size={28} />
          </div>
          <h2 className="session-loading-title">Staff Management Portal</h2>
          <div className="session-loading-error-row">
            <AlertCircle size={20} className="connection-error-icon" />
            <p className="session-loading-error-text">
              Unable to reach backend server. Waiting for backend to become available...
            </p>
          </div>
          <button
            type="button"
            onClick={handleManualReconnect}
            className="btn-primary compact-btn"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'HOME') {
    return <HomePage onNavigate={handleNavigate} currentUser={currentUser} />;
  }

  if (currentPage === 'WELCOME') {
    return (
      <WelcomePage
        user={currentUser}
        onUserUpdate={handleUserUpdate}
        onSignOut={handleSignOut}
        onForgotPassword={handleOpenForgotPassword}
        backendConnectionError={backendConnectionError}
        onRetryConnection={handleManualReconnect}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand" onClick={() => handleNavigate('HOME')}>
          <div className="brand-logo-icon">
            <Users size={20} />
          </div>
          <span className="brand-logo-text">Staff Management Portal</span>
        </div>

        <div className="header-nav-actions">
          {currentPage !== 'LOGIN' && (
            <button
              type="button"
              onClick={() => handleNavigate('LOGIN')}
              className="btn-header-link"
            >
              Login
            </button>
          )}
          {currentPage !== 'REGISTER' && currentPage !== 'OTP_VERIFY' && currentPage !== 'SUCCESS' && (
            <button
              type="button"
              onClick={() => handleNavigate('REGISTER')}
              className="btn-header-primary"
            >
              Sign Up
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'REGISTER' && (
          <AdminRegisterForm
            onOtpSent={handleOtpSent}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'LOGIN' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigate={handleNavigate}
            initialError={loginError}
            initialSuccess={loginSuccessMessage}
            googleRegData={googleRegData}
            onCancelGoogleReg={() => setGoogleRegData(null)}
            onForgotPassword={() => handleOpenForgotPassword('')}
            isOAuthError={isOAuthError}
          />
        )}

        {currentPage === 'FORGOT_PASSWORD' && (
          <ForgotPassword
            initialEmail={forgotPasswordEmail}
            onSuccess={handleForgotPasswordSuccess}
            onCancel={() => handleNavigate('LOGIN')}
          />
        )}

        {currentPage === 'OTP_VERIFY' && (
          <OtpVerification
            email={registeredEmail}
            onVerified={handleOtpVerified}
            onBack={() => handleNavigate('REGISTER')}
          />
        )}

        {currentPage === 'SUCCESS' && (
          <RegistrationSuccess onProceedToLogin={handleProceedToLogin} />
        )}
      </main>

      <footer className="app-footer">
        <p>Staff Management Portal &bull; Enterprise Administration Module</p>
      </footer>
    </div>
  );
};

export default App;
