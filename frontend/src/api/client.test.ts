import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { api } from './client';
import { auth } from '@/auth/auth';

const mock = new MockAdapter(api);
// Separate adapter for the raw axios instance used by the refresh call
const axiosMock = new MockAdapter(axios);

beforeEach(() => {
  mock.reset();
  axiosMock.reset();
  localStorage.clear();
});

afterAll(() => {
  mock.restore();
  axiosMock.restore();
});

describe('request interceptor', () => {
  it('attaches Authorization header when an access token is stored', async () => {
    auth.setTokens('my-access-token', 'my-refresh-token');
    mock.onGet('/gardens/').reply(200, []);

    const res = await api.get('/gardens/');

    expect(res.config.headers.Authorization).toBe('Bearer my-access-token');
  });

  it('does not attach Authorization header when no token is stored', async () => {
    mock.onGet('/gardens/').reply(200, []);

    const res = await api.get('/gardens/');

    expect(res.config.headers.Authorization).toBeUndefined();
  });
});

describe('response interceptor', () => {
  it('retries the original request with a new token after a successful refresh', async () => {
    auth.setTokens('expired-access', 'valid-refresh');

    mock.onGet('/gardens/').replyOnce(401).onGet('/gardens/').reply(200, [{ id: 'g1' }]);
    axiosMock.onPost('http://127.0.0.1:8000/api/auth/token/refresh/').reply(200, { access: 'new-access' });

    const res = await api.get('/gardens/');

    expect(res.data).toEqual([{ id: 'g1' }]);
    expect(auth.getAccessToken()).toBe('new-access');
  });

  it('clears tokens and redirects to /login when refresh fails', async () => {
    auth.setTokens('expired-access', 'invalid-refresh');
    const assignSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: '',
    } as Location);

    mock.onGet('/gardens/').reply(401);
    axiosMock.onPost('http://127.0.0.1:8000/api/auth/token/refresh/').reply(401);

    await expect(api.get('/gardens/')).rejects.toBeDefined();

    expect(auth.getAccessToken()).toBeNull();
    expect(auth.getRefreshToken()).toBeNull();

    assignSpy.mockRestore();
  });

  it('clears tokens and redirects when no refresh token is stored', async () => {
    auth.setTokens('expired-access', '');
    auth.clearTokens();

    mock.onGet('/gardens/').reply(401);

    await expect(api.get('/gardens/')).rejects.toBeDefined();

    expect(auth.getAccessToken()).toBeNull();
  });

  it('does not retry on non-401 errors', async () => {
    mock.onGet('/gardens/').reply(500);

    await expect(api.get('/gardens/')).rejects.toBeDefined();

    expect(axiosMock.history.post).toHaveLength(0);
  });
});
