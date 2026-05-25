import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { login } from '@/api/auth';
import { mockNavigate } from '@/test/test-setup';
import Login from './Login';

vi.mock('@/api/auth', () => ({
  login: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(login).mockClear();
});

describe('Login', () => {
  it('renders username and password fields', () => {
    render(<Login />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('submit button is disabled when fields are empty', () => {
    render(<Login />);
    expect(screen.getByRole('button', { name: /login/i })).toBeDisabled();
  });

  it('submit button enables once both fields are filled', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'secret');

    expect(screen.getByRole('button', { name: /login/i })).toBeEnabled();
  });

  it('calls login() with username and password on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValueOnce({});
    render(<Login />);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(login).toHaveBeenCalledWith('alice', 'secret');
  });

  it('navigates to gardens on successful login', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValueOnce({});
    render(<Login />);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/gardens'));
  });

  it('shows a root error message on API failure', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockRejectedValueOnce({ isAxiosError: true, response: { data: { detail: 'Invalid credentials.' } } });
    render(<Login />);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => expect(screen.getByText('Invalid credentials.')).toBeInTheDocument());
  });

  it('has a link to the register page', () => {
    render(<Login />);
    expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
  });
});
