import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import AdminRegisterForm from './components/AdminRegisterForm';
import OtpVerification from './components/OtpVerification';
import RegistrationSuccess from './components/RegistrationSuccess';
import WelcomePage from './components/WelcomePage';
import { getStoredUser, logoutUser } from './services/authService';
import { Users } from 'lucide-react';
import './App.css';

const App = () => {
  const [currentPage, setCurrentPage] = useState('HOME');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }
  }, []);

  const handleNavigate = (page) => {
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
    setCurrentPage('LOGIN');
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setCurrentPage('WELCOME');
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser((prev) => ({ ...prev, ...updatedUser }));
  };

  const handleSignOut = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentPage('HOME');
  };

  if (currentPage === 'HOME') {
    return <HomePage onNavigate={handleNavigate} />;
  }

  if (currentPage === 'WELCOME') {
    return (
      <WelcomePage
        user={currentUser}
        onUserUpdate={handleUserUpdate}
        onSignOut={handleSignOut}
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
