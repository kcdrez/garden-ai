import { api } from "./client";
import { auth } from "@/auth/auth";

function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export async function login(username: string, password: string) {
  const res = await api.post("/auth/token/", {
    username,
    password,
    timezone: browserTimezone(),
  });

  auth.setTokens(res.data.access, res.data.refresh);

  return res.data;
}

export async function register(username: string, password: string, password_confirm: string, email: string) {
  const res = await api.post("/auth/register/", {
    username,
    password,
    password_confirm,
    email,
    timezone: browserTimezone(),
  });

  auth.setTokens(res.data.access, res.data.refresh);

  return res.data;
}

export async function forgotPassword(email: string) {
  const res = await api.post("/auth/password/reset/", { email });
  return res.data;
}

export async function resetPassword(uid: string, token: string, newPassword: string) {
  const res = await api.post("/auth/password/reset/confirm/", { uid, token, newPassword });
  return res.data;
}
