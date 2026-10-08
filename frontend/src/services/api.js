import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("transferaToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("transferaToken");
      window.dispatchEvent(new Event("auth:expired"));
    }

    return Promise.reject(error);
  },
);

export const get = (url, options = {}) => api.get(url, options);
export const post = (url, data, options = {}) => api.post(url, data, options);
export const put = (url, data, options = {}) => api.put(url, data, options);
export const patch = (url, data, options = {}) => api.patch(url, data, options);
