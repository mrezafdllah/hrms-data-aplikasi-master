export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiFetch = async (url, options = {}) => {
  // Update last active time to reset inactivity timer
  localStorage.setItem('lastActiveTime', Date.now().toString());

  const token = localStorage.getItem('token');
  const headers = {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.headers) {
    Object.assign(headers, options.headers);
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Prepend API_BASE_URL if url is relative (doesn't start with http/https)
  const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, '');
  const cleanUrl = url.startsWith('http') 
    ? url 
    : `${cleanBaseUrl}/${url.replace(/^\/+/, '')}`;
  
  const response = await fetch(cleanUrl, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    window.location.href = '/login';
  }
  
  return response;
};
