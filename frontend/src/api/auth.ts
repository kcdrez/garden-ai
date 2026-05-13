import { api } from "./client";
import { auth } from "../auth/auth";

export async function login(username: string, password: string) {
  const res = await api.post("/auth/token/", {
    username,
    password,
  });

  auth.setTokens(res.data.access, res.data.refresh);

  return res.data;
}
