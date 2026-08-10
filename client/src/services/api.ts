import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Token & Session ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mars_auth_token');
  const sessionId = localStorage.getItem('mars_session_id');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (sessionId) {
    config.headers['x-session-id'] = sessionId;
  }

  return config;
});

// Response Interceptor: Handle single-session termination
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.code === 'SESSION_TERMINATED') {
      localStorage.removeItem('mars_auth_token');
      localStorage.removeItem('mars_session_id');
      window.location.href = '/login?reason=session_terminated';
    }
    return Promise.reject(error);
  }
);

export default api;
