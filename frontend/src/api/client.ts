import axios from "axios";
import { auth } from "../auth/auth";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

api.interceptors.request.use((config) => {
  const token = auth.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
