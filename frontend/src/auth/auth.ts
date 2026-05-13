const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const auth = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),

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
