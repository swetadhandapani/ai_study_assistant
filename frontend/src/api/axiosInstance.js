import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-study-assistant-pumn.onrender.com/api';

const instance = axios.create({
  baseURL: API_BASE
});

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
