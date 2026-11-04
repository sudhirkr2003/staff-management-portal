import api from './api';

export const createCompany = async (companyData) => {
  const response = await api.post('/api/companies', companyData);
  return response.data;
};

export const getMyCompany = async () => {
  const response = await api.get('/api/companies/my');
  return response.data;
};

export const updateCompany = async (companyData) => {
  const response = await api.put('/api/companies/my', companyData);
  return response.data;
};

