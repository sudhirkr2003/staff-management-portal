import React, { useState, useEffect, useCallback } from 'react';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import AdminRegisterForm from './components/AdminRegisterForm';
import OtpVerification from './components/OtpVerification';
import RegistrationSuccess from './components/RegistrationSuccess';
import WelcomePage from './components/WelcomePage';
import ForgotPassword from './components/ForgotPassword';
import CreateCompanyPage from './components/CreateCompanyPage';
import NotFoundPage from './components/NotFoundPage';
import { getStoredUser, getStoredToken, logoutUser, getProfile } from './services/authService';
import { getMyCompany } from './services/companyService';
import { Users, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import './App.css';

const resolvePath = (target) => {
  switch (target) {
    case 'HOME':
    case '/home':
      return '/home';
    case '/':
      return '/';
    case 'LOGIN':
    case '/login':
      return '/login';
    case 'REGISTER':
    case '/register':
    case 'SIGNUP':
    case '/signup':
      return '/register';
    case 'CREATE_COMPANY':
    case '/create-company':
    case '/company/create':
      return '/company/create';
    case 'WELCOME':
    case 'DASHBOARD':
    case '/dashboard':
      return '/dashboard';
    case 'EMPLOYEES':
    case 'MANAGE_EMPLOYEES':
    case '/employees':
      return '/employees';
    case 'EMPLOYEES_NEW':
    case '/employees/new':
      return '/employees/new';
    case 'OTP_VERIFY':
    case '/verify-otp':
      return '/verify-otp';
    case 'SUCCESS':
    case '/registration-success':
      return '/registration-success';
    case 'FORGOT_PASSWORD':
    case '/forgot-password':
      return '/forgot-password';
    default:
      return target;
  }
};

const matchEmployeeId = (path) => {
  const m = path.match(/^\/employees\/(\d+)$/);
  return m ? m[1] : null;
};

const matchEmployeeEdit = (path) => {
  const m = path.match(/^\/employees\/(\d+)\/edit$/);
  return m ? m[1] : null;
};

const isProtectedPath = (path) => {
  if (!path) return false;
  if (
    path === '/dashboard' ||
    path === '/employees' ||
    path === '/employees/new' ||
    path === '/company' ||
    path === '/company/create'
  ) return true;
  if (matchEmployeeId(path) || matchEmployeeEdit(path)) return true;
  return false;
};

const App = () => {
  const [currentPath, setCurrentPath] = useState(() => {
    const p = window.location.pathname;
    const normalized = p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
    return normalized === '/signup' ? '/register' : normalized;
  });
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [currentCompany, setCurrentCompany] = useState(null);
  const [googleRegData, setGoogleRegData] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [isOAuthError, setIsOAuthError] = useState(false);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [backendConnectionError, setBackendConnectionError] = useState(false);

  const verifySession = useCallback(async (token, fallbackUser, targetPath) => {
    try {
      const response = await getProfile();
      if (response && response.success && response.data) {
        localStorage.setItem('auth_user', JSON.stringify(response.data));
        setCurrentUser(response.data);
        setBackendConnectionError(false);

        let companyData = null;
        if (response.data.role === 'ADMIN') {
          try {
            const compRes = await getMyCompany();
            if (compRes && compRes.success && compRes.data) {
              companyData = compRes.data;
            }
          } catch (e) {}
        }
        setCurrentCompany(companyData);

        if (response.data.role === 'ADMIN' && !companyData) {
          if (
            targetPath === '/' ||
            targetPath === '/login' ||
            targetPath === '/register' ||
            targetPath === '/dashboard' ||
            targetPath === '/employees' ||
            targetPath === '/employees/new' ||
            targetPath === '/company' ||
            matchEmployeeId(targetPath) ||
            matchEmployeeEdit(targetPath)
          ) {
            window.history.replaceState({}, '', '/company/create');
            setCurrentPath('/company/create');
            return;
          }
        } else if (targetPath === '/' || targetPath === '/login' || targetPath === '/register') {
          window.history.replaceState({}, '', '/dashboard');
          setCurrentPath('/dashboard');
        }
      }
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        logoutUser();
        setCurrentUser(null);
        setCurrentCompany(null);
        setBackendConnectionError(false);
        setLoginError('Your session has expired. Please sign in again.');
        if (targetPath === '/') {
          window.history.replaceState({}, '', '/home');
          setCurrentPath('/home');
        } else {
          window.history.replaceState({}, '', '/login');
          setCurrentPath('/login');
        }
      } else {
        setBackendConnectionError(true);
        if (fallbackUser) {
          setCurrentUser(fallbackUser);
        }
      }
    } finally {
      setIsRestoringSession(false);
    }
  }, []);

  const navigateTo = useCallback((target, replace = false) => {
    let targetPath = resolvePath(target);

    if ((targetPath === '/login' || targetPath === '/register') && getStoredToken() && currentUser) {
      targetPath = currentUser.role === 'ADMIN' && !currentCompany ? '/company/create' : '/dashboard';
    }

    if (isProtectedPath(targetPath) && !getStoredToken()) {
      targetPath = '/home';
    }

    if (isProtectedPath(targetPath) && currentUser && currentUser.role === 'ADMIN' && !currentCompany) {
      if (targetPath !== '/company/create') {
        targetPath = '/company/create';
      }
    }

    setLoginError('');
    setIsOAuthError(false);
    setLoginSuccessMessage('');
    if (targetPath !== '/login' && targetPath !== '/register') {
      setGoogleRegData(null);
    }

    if (replace) {
      window.history.replaceState({}, '', targetPath);
    } else {
      window.history.pushState({}, '', targetPath);
    }
    setCurrentPath(targetPath);
  }, [currentUser, currentCompany]);

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      const normalized = p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
      if (normalized === '/signup') {
        window.history.replaceState({}, '', '/register');
        setCurrentPath('/register');
      } else {
        setCurrentPath(normalized);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');

    if (status === 'login_success') {
      const token = params.get('token');
      if (token) {
        localStorage.setItem('auth_token', token);
        window.history.replaceState({}, document.title, '/dashboard');
        setCurrentPath('/dashboard');
        verifySession(token, null, '/dashboard');
        return;
      }
    } else if (status === 'google_register') {
      const regToken = params.get('regToken');
      const email = params.get('email');
      const fullName = params.get('fullName');
      window.history.replaceState({}, document.title, '/login');
      setCurrentPath('/login');
      setGoogleRegData({ regToken, email: email || '', fullName: fullName || '' });
      setIsOAuthError(false);
      setIsRestoringSession(false);
      return;
    } else if (status === 'error') {
      const errorType = params.get('errorType');
      const rawMessage = params.get('message') || '';
      window.history.replaceState({}, document.title, '/login');
      setCurrentPath('/login');

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
      return;
    }

    let initialPath = window.location.pathname.length > 1 && window.location.pathname.endsWith('/')
      ? window.location.pathname.slice(0, -1)
      : window.location.pathname;

    if (initialPath === '/signup') {
      window.history.replaceState({}, document.title, '/register');
      initialPath = '/register';
      setCurrentPath('/register');
    }

    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    if (storedToken) {
      if (storedUser) {
        setCurrentUser(storedUser);
      }
      verifySession(storedToken, storedUser, initialPath);
    } else {
      setIsRestoringSession(false);
      if (isProtectedPath(initialPath) || initialPath === '/' || initialPath === '/company/create') {
        window.history.replaceState({}, document.title, '/home');
        setCurrentPath('/home');
      }
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
              if (currentPath === '/' || currentPath === '/login') {
                window.history.replaceState({}, '', '/dashboard');
                setCurrentPath('/dashboard');
              }
            }
          })
          .catch((err) => {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
              logoutUser();
              setCurrentUser(null);
              setCurrentCompany(null);
              setBackendConnectionError(false);
              setLoginError('Your session has expired. Please sign in again.');
              window.history.replaceState({}, '', '/login');
              setCurrentPath('/login');
            }
          });
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [backendConnectionError, currentPath]);

  const handleManualReconnect = async () => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token) {
      await verifySession(token, user, currentPath);
    }
  };

  const handleOtpSent = (email) => {
    setRegisteredEmail(email);
    navigateTo('/verify-otp');
  };

  const handleOtpVerified = () => {
    navigateTo('/registration-success');
  };

  const handleProceedToLogin = () => {
    setLoginError('');
    setIsOAuthError(false);
    setLoginSuccessMessage('');
    setGoogleRegData(null);
    navigateTo('/login');
  };

  const handleLoginSuccess = async (userData) => {
    setGoogleRegData(null);
    setLoginSuccessMessage('');
    setCurrentUser(userData);
    setBackendConnectionError(false);

    if (userData && userData.role === 'ADMIN') {
      let companyData = null;
      try {
        const compRes = await getMyCompany();
        if (compRes && compRes.success && compRes.data) {
          companyData = compRes.data;
        }
      } catch (e) {}
      setCurrentCompany(companyData);

      if (!companyData) {
        navigateTo('/company/create');
      } else {
        navigateTo('/dashboard');
      }
    } else {
      navigateTo('/dashboard');
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const handleSignOut = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentCompany(null);
    setBackendConnectionError(false);
    setGoogleRegData(null);
    navigateTo('/home');
  };

  const handleOpenForgotPassword = (email = '') => {
    setForgotPasswordEmail(email);
    setLoginError('');
    setLoginSuccessMessage('');
    navigateTo('/forgot-password');
  };

  const handleForgotPasswordSuccess = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentCompany(null);
    setBackendConnectionError(false);
    setLoginSuccessMessage('Password reset successfully. Please sign in with your new password.');
    navigateTo('/login');
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
            <span>Verifying authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  if (backendConnectionError && (!currentUser || currentPath === '/dashboard' || currentPath === '/' || currentPath === '/company/create')) {
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

  if (currentPath === '/home' || currentPath === '/') {
    return <HomePage onNavigate={navigateTo} currentUser={currentUser} />;
  }

  if (currentPath === '/company/create') {
    if (!currentUser || !getStoredToken()) {
      window.history.replaceState({}, '', '/login');
      setCurrentPath('/login');
      return null;
    }
    if (currentUser.role !== 'ADMIN' || currentCompany) {
      window.history.replaceState({}, '', '/dashboard');
      setCurrentPath('/dashboard');
      return null;
    }
    return (
      <CreateCompanyPage
        onCompanyCreated={(newCompany) => {
          setCurrentCompany(newCompany);
          window.history.replaceState({}, '', '/dashboard');
          setCurrentPath('/dashboard');
        }}
        onSignOut={handleSignOut}
      />
    );
  }

  if (
    currentPath === '/dashboard' ||
    currentPath === '/employees' ||
    currentPath === '/employees/new' ||
    matchEmployeeId(currentPath) ||
    matchEmployeeEdit(currentPath)
  ) {
    if (!currentUser || !getStoredToken()) {
      window.history.replaceState({}, '', '/home');
      setCurrentPath('/home');
      return null;
    }
    if (currentUser.role === 'ADMIN' && !currentCompany) {
      window.history.replaceState({}, '', '/company/create');
      setCurrentPath('/company/create');
      return null;
    }
    return (
      <WelcomePage
        user={currentUser}
        company={currentCompany}
        currentPath={currentPath}
        onNavigate={navigateTo}
        onUserUpdate={handleUserUpdate}
        onCompanyUpdate={(updatedCompany) => setCurrentCompany(updatedCompany)}
        onSignOut={handleSignOut}
        onBackToHome={() => navigateTo('/home')}
        onForgotPassword={handleOpenForgotPassword}
        backendConnectionError={backendConnectionError}
        onRetryConnection={handleManualReconnect}
      />
    );
  }

  const isKnownShellRoute =
    currentPath === '/login' ||
    currentPath === '/register' ||
    currentPath === '/verify-otp' ||
    currentPath === '/registration-success' ||
    currentPath === '/forgot-password';

  if (!isKnownShellRoute) {
    return (
      <NotFoundPage
        onNavigate={navigateTo}
        isAuthenticated={Boolean(currentUser && getStoredToken())}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand" onClick={() => navigateTo('/home')}>
          <div className="brand-logo-icon">
            <Users size={20} />
          </div>
          <span className="brand-logo-text">Staff Management Portal</span>
        </div>

        <div className="header-nav-actions">
          {currentPath !== '/login' && (
            <button
              type="button"
              onClick={() => navigateTo('/login')}
              className="btn-header-link"
            >
              Login
            </button>
          )}
          {currentPath !== '/register' && currentPath !== '/verify-otp' && currentPath !== '/registration-success' && (
            <button
              type="button"
              onClick={() => navigateTo('/register')}
              className="btn-header-primary"
            >
              Sign Up
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <div className="auth-page-container">
          <div className="auth-back-nav">
            <button
              type="button"
              onClick={() => navigateTo('/home')}
              className="auth-back-link"
              aria-label="Back to Home"
            >
              <ArrowLeft size={15} />
              <span>Back to Home</span>
            </button>
          </div>

          {currentPath === '/register' && (
            <AdminRegisterForm
              onOtpSent={handleOtpSent}
              onNavigate={navigateTo}
            />
          )}

          {currentPath === '/login' && (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigate={navigateTo}
              initialError={loginError}
              initialSuccess={loginSuccessMessage}
              googleRegData={googleRegData}
              onCancelGoogleReg={() => setGoogleRegData(null)}
              onForgotPassword={() => handleOpenForgotPassword('')}
              isOAuthError={isOAuthError}
            />
          )}

          {currentPath === '/forgot-password' && (
            <ForgotPassword
              initialEmail={forgotPasswordEmail}
              onSuccess={handleForgotPasswordSuccess}
              onCancel={() => navigateTo('/login')}
            />
          )}

          {currentPath === '/verify-otp' && (
            <OtpVerification
              email={registeredEmail}
              onVerified={handleOtpVerified}
              onBack={() => navigateTo('/register')}
            />
          )}

          {currentPath === '/registration-success' && (
            <RegistrationSuccess onProceedToLogin={handleProceedToLogin} />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Staff Management Portal &bull; Enterprise Administration Module</p>
      </footer>
    </div>
  );
};

export default App;
