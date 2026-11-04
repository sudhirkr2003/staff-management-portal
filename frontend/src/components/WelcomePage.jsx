import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Shield, LogOut, Settings, CheckCircle2, AlertCircle, Loader2, X, Users, Lock } from 'lucide-react';
import { updateProfile } from '../services/authService';
import ChangePasswordModal from './ChangePasswordModal';

const WelcomePage = ({
  user,
  onUserUpdate,
  onSignOut,
  onForgotPassword,
  backendConnectionError,
  onRetryConnection
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [fullNameInput, setFullNameInput] = useState(user?.fullName || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.fullName) {
      setFullNameInput(user.fullName);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenProfile = () => {
    setFullNameInput(user?.fullName || '');
    setProfileError('');
    setProfileSuccess('');
    setIsDropdownOpen(false);
    setIsProfileModalOpen(true);
  };

  const handleOpenChangePassword = () => {
    setIsProfileModalOpen(false);
    setIsChangePasswordModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullNameInput.trim()) {
      setProfileError('Full name is required');
      return;
    }
    if (fullNameInput.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters');
      return;
    }

    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await updateProfile({ fullName: fullNameInput.trim() });
      if (response.success && response.data) {
        onUserUpdate(response.data);
        setProfileSuccess('Profile updated successfully');
        setTimeout(() => {
          setIsProfileModalOpen(false);
          setProfileSuccess('');
        }, 1200);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setProfileError(err.response.data.message || 'Failed to update profile');
      } else {
        setProfileError('Network error while updating profile');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="welcome-container">
      <header className="welcome-header">
        <div className="welcome-brand">
          <div className="brand-logo-icon">
            <Users size={22} />
          </div>
          <span className="welcome-brand-text">Staff Management Portal</span>
        </div>

        <div className="profile-menu-wrapper" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="profile-btn"
          >
            <div className="user-avatar">{getInitials(user?.fullName)}</div>
            <span className="user-display-name">{user?.fullName || 'Administrator'}</span>
          </button>

          {isDropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-user-header">
                <p className="dropdown-user-name">{user?.fullName}</p>
                <p className="dropdown-user-email">{user?.email}</p>
              </div>
              <div className="dropdown-divider"></div>
              <button
                type="button"
                onClick={handleOpenProfile}
                className="dropdown-item"
              >
                <Settings size={16} />
                <span>Manage Profile</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="dropdown-item text-danger"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {backendConnectionError && (
        <div className="connection-banner">
          <div className="connection-banner-content">
            <Loader2 size={16} className="spinner" />
            <span>Connecting to server... Waiting for backend to become available.</span>
          </div>
          <button
            type="button"
            onClick={onRetryConnection}
            className="btn-connection-retry"
          >
            Retry Connection
          </button>
        </div>
      )}

      <main className="welcome-main">
        <div className="welcome-card">
          <div className="welcome-hero-badge">Administrator Session</div>
          <h1 className="welcome-title">Welcome to Staff Management Portal</h1>
          <p className="welcome-message">
            You have successfully signed in to your account.
          </p>

          <div className="welcome-profile-preview">
            <div className="preview-avatar">{getInitials(user?.fullName)}</div>
            <div className="preview-info">
              <h3 className="preview-name">{user?.fullName}</h3>
              <p className="preview-email">{user?.email}</p>
              <span className="preview-role">{user?.role || 'ADMIN'}</span>
            </div>
          </div>
        </div>
      </main>

      {isProfileModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card profile-modal-card">
            <div className="profile-modal-header">
              <div className="profile-modal-title-wrap">
                <div className="profile-modal-icon-badge">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="profile-modal-title">Manage Profile</h2>
                  <p className="profile-modal-subtitle">Update your personal account details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="profile-modal-close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {profileSuccess && (
              <div className="alert alert-success compact-alert">
                <CheckCircle2 size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="alert alert-error compact-alert">
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="profile-modal-form">
              <div className="form-group compact-group">
                <label className="form-label compact-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-input compact-input input-disabled"
                  />
                </div>
                <p className="input-hint subtle-hint">Email address cannot be changed in this release.</p>
              </div>

              <div className="form-group compact-group">
                <label htmlFor="edit-fullname" className="form-label compact-label">
                  Full Name
                </label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    id="edit-fullname"
                    value={fullNameInput}
                    onChange={(e) => {
                      setFullNameInput(e.target.value);
                      setProfileError('');
                    }}
                    disabled={isSavingProfile}
                    className="form-input compact-input"
                    placeholder="Enter Your Name"
                  />
                </div>
              </div>

              <div className="profile-security-card">
                <div className="security-card-main">
                  <div className="security-card-icon-badge">
                    <Shield size={18} />
                  </div>
                  <div className="security-card-text">
                    <span className="security-card-title">Password &amp; Security</span>
                    <span className="security-card-desc">Manage your account password and security.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenChangePassword}
                  className="btn-profile-change-pass"
                >
                  <Lock size={14} />
                  <span>Change Password</span>
                </button>
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  disabled={isSavingProfile}
                  className="btn-profile-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-profile-save"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          user={user}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onBackToProfile={() => {
            setIsChangePasswordModalOpen(false);
            setIsProfileModalOpen(true);
          }}
          onForgotPassword={(email) => {
            setIsChangePasswordModalOpen(false);
            onForgotPassword(email);
          }}
        />
      )}
    </div>
  );
};

export default WelcomePage;
