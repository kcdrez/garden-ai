import { api } from "./client";

export async function login(username: string, password: string) {
  const res = await api.post("/auth/token/", {
    username,
    password,
  });

  const { access, refresh } = res.data;

  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);

  return res.data;
}
