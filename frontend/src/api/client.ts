import axios from 'axios';

const API_BASE_URL = typeof window !== 'undefined'
  ? `http://${window.location.hostname}:3000`
  : 'http://localhost:3000';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = error.response?.data?.error;
    if (typeof serverMessage === 'string' && serverMessage.trim()) return serverMessage;
    if (!error.response) return 'Unable to reach the API. Start the backend on port 3000 and try again.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('interview_tracker_auth_token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(undefined, async (error) => {
  const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('interview_tracker_refresh_token') : null;
  if (error.response?.status !== 401 || !original || original._retry || !refreshToken || original.url?.includes('/auth/refresh')) {
    return Promise.reject(error);
  }
  original._retry = true;
  try {
    const response = await axios.post<{ accessToken: string; refreshToken: string }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    localStorage.setItem('interview_tracker_auth_token', response.data.accessToken);
    localStorage.setItem('interview_tracker_refresh_token', response.data.refreshToken);
    original.headers.Authorization = `Bearer ${response.data.accessToken}`;
    return client(original);
  } catch (refreshError) {
    localStorage.removeItem('interview_tracker_auth_token');
    localStorage.removeItem('interview_tracker_refresh_token');
    return Promise.reject(refreshError);
  }
});

export default client;
