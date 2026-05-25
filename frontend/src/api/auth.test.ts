import { login, register, forgotPassword, resetPassword } from './auth';
import { api } from './client';
import { auth } from '@/auth/auth';

vi.mock('./client', () => ({ api: { post: vi.fn() } }));
vi.mock('@/auth/auth', () => ({ auth: { setTokens: vi.fn() } }));

describe('login', () => {
  it('posts to the token endpoint with credentials and timezone', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { access: 'acc', refresh: 'ref' } });

    await login('alice', 'secret');

    expect(api.post).toHaveBeenCalledWith('/auth/token/', expect.objectContaining({
      username: 'alice',
      password: 'secret',
      timezone: 'UTC',
    }));
  });

  it('stores tokens on success', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { access: 'acc', refresh: 'ref' } });

    await login('alice', 'secret');

    expect(auth.setTokens).toHaveBeenCalledWith('acc', 'ref');
  });
});

describe('register', () => {
  it('posts to the register endpoint with credentials and timezone', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { access: 'acc', refresh: 'ref' } });

    await register('alice', 'password1', 'password1');

    expect(api.post).toHaveBeenCalledWith('/auth/register/', expect.objectContaining({
      username: 'alice',
      password: 'password1',
      password_confirm: 'password1',
      timezone: 'UTC',
    }));
  });

  it('includes email when provided', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { access: 'acc', refresh: 'ref' } });

    await register('alice', 'password1', 'password1', 'alice@example.com');

    expect(api.post).toHaveBeenCalledWith('/auth/register/', expect.objectContaining({
      email: 'alice@example.com',
    }));
  });

  it('stores tokens on success', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { access: 'acc', refresh: 'ref' } });

    await register('alice', 'password1', 'password1');

    expect(auth.setTokens).toHaveBeenCalledWith('acc', 'ref');
  });
});

describe('forgotPassword', () => {
  it('posts email to the password reset endpoint', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { detail: 'ok' } });

    await forgotPassword('alice@example.com');

    expect(api.post).toHaveBeenCalledWith('/auth/password/reset/', { email: 'alice@example.com' });
  });
});

describe('resetPassword', () => {
  it('posts uid, token, and new password to the confirm endpoint', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { detail: 'ok' } });

    await resetPassword('abc123', 'tok456', 'newpassword');

    expect(api.post).toHaveBeenCalledWith('/auth/password/reset/confirm/', {
      uid: 'abc123',
      token: 'tok456',
      newPassword: 'newpassword',
    });
  });
});
