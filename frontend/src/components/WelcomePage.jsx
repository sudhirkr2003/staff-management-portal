import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, CheckCircle2, AlertCircle, Loader2, X, Users } from 'lucide-react';
import { updateProfile } from '../services/authService';

const WelcomePage = ({ user, onUserUpdate, onSignOut }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-group">
                <Settings size={20} className="modal-icon" />
                <h2 className="modal-title">Manage Profile</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="modal-close-btn"
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

            <form onSubmit={handleSaveProfile} className="form-content compact-form">
              <div className="form-group compact-group">
                <label className="form-label compact-label">Email Address</label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="form-input compact-input input-disabled"
                  />
                </div>
                <p className="input-hint">Email address cannot be changed in this release.</p>
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

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  disabled={isSavingProfile}
                  className="btn-secondary compact-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-primary compact-btn"
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
    </div>
  );
};

export default WelcomePage;
