import { auth } from './auth';

beforeEach(() => localStorage.clear());

describe('auth', () => {
  describe('setTokens', () => {
    it('stores access and refresh tokens in localStorage', () => {
      auth.setTokens('access-abc', 'refresh-xyz');
      expect(auth.getAccessToken()).toBe('access-abc');
      expect(auth.getRefreshToken()).toBe('refresh-xyz');
    });
  });

  describe('clearTokens', () => {
    it('removes both tokens from localStorage', () => {
      auth.setTokens('access-abc', 'refresh-xyz');
      auth.clearTokens();
      expect(auth.getAccessToken()).toBeNull();
      expect(auth.getRefreshToken()).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('returns false when no access token is stored', () => {
      expect(auth.isLoggedIn()).toBe(false);
    });

    it('returns true when an access token is stored', () => {
      auth.setTokens('access-abc', 'refresh-xyz');
      expect(auth.isLoggedIn()).toBe(true);
    });

    it('returns false after tokens are cleared', () => {
      auth.setTokens('access-abc', 'refresh-xyz');
      auth.clearTokens();
      expect(auth.isLoggedIn()).toBe(false);
    });
  });
});
