import api from './api';

export const registerAdmin = async (registrationData) => {
  const response = await api.post('/api/auth/admin/register', registrationData);
  if (response.data && response.data.data && response.data.data.token) {
    localStorage.setItem('auth_token', response.data.data.token);
    localStorage.setItem('auth_user', JSON.stringify(response.data.data));
  }
  return response.data;
};

export const verifyOtp = async (verificationData) => {
  const response = await api.post('/api/auth/admin/verify-otp', verificationData);
  return response.data;
};

export const resendOtp = async (resendData) => {
  const response = await api.post('/api/auth/admin/resend-otp', resendData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  if (response.data && response.data.data && response.data.data.token) {
    localStorage.setItem('auth_token', response.data.data.token);
    localStorage.setItem('auth_user', JSON.stringify(response.data.data));
  }
  return response.data;
};

export const completeGoogleRegistration = async (registrationData) => {
  const response = await api.post('/api/auth/google/complete-registration', registrationData);
  if (response.data && response.data.data && response.data.data.token) {
    localStorage.setItem('auth_token', response.data.data.token);
    localStorage.setItem('auth_user', JSON.stringify(response.data.data));
  }
  return response.data;
};

export const linkGoogleAccount = async (linkData) => {
  const response = await api.post('/api/auth/google/link-account', linkData);
  if (response.data && response.data.data && response.data.data.token) {
    localStorage.setItem('auth_token', response.data.data.token);
    localStorage.setItem('auth_user', JSON.stringify(response.data.data));
  }
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/api/auth/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/api/auth/profile', profileData);
  if (response.data && response.data.data) {
    const existing = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const updated = { ...existing, ...response.data.data };
    localStorage.setItem('auth_user', JSON.stringify(updated));
  }
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await api.post('/api/auth/change-password', passwordData);
  return response.data;
};

export const forgotPassword = async (emailData) => {
  const response = await api.post('/api/auth/forgot-password', emailData);
  return response.data;
};

export const resendResetOtp = async (emailData) => {
  const response = await api.post('/api/auth/resend-reset-otp', emailData);
  return response.data;
};

export const verifyResetOtp = async (verificationData) => {
  const response = await api.post('/api/auth/verify-reset-otp', verificationData);
  return response.data;
};

export const resetPassword = async (resetData) => {
  const response = await api.post('/api/auth/reset-password', resetData);
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

export const getStoredUser = () => {
  const stored = localStorage.getItem('auth_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
};

export const getStoredToken = () => {
  return localStorage.getItem('auth_token');
};

export const verifyAdminPrivileges = async () => {
  const response = await api.get('/api/admin/verify');
  return response.data;
};
