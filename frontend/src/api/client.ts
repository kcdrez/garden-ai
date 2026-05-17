import axios from "axios";
import { auth } from "@/auth/auth";

const BASE_URL = "http://127.0.0.1:8000/api";

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = auth.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refreshToken = auth.getRefreshToken();
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          auth.setTokens(res.data.access, refreshToken);
          original.headers.Authorization = `Bearer ${res.data.access}`;
          return api(original);
        } catch {
          auth.clearTokens();
          window.location.href = "/login";
        }
      } else {
        auth.clearTokens();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
