import api from './api';

export const createEmployee = async (employeeData) => {
  const response = await api.post('/api/employees', employeeData);
  return response.data;
};

export const getEmployees = async () => {
  const response = await api.get('/api/employees');
  return response.data;
};

