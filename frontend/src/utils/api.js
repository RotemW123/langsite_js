export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:5001';

// Helper function for authenticated requests
export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
};