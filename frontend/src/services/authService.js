import api from './api';

export const registerAdmin = async (registrationData) => {
  const response = await api.post('/api/auth/admin/register', registrationData);
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
