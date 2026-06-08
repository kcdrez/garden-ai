// Tokens are stored in localStorage (not httpOnly cookies) to support silent JWT refresh on 401.
// A Content Security Policy on the server limits XSS exposure.
const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const auth = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),

  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },

  clearTokens: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },

  isLoggedIn: () => !!localStorage.getItem(ACCESS_KEY),
};
