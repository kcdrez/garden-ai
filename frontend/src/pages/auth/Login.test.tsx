import { render, screen, waitFor } from '@/test/test-utils';
import { render as rtlRender } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { login } from '@/api/auth';
import { mockNavigate } from '@/test/test-setup';
import Login from './Login';

function renderWithState(state: object) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return rtlRender(<Login />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    ),
  });
}

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
    expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled();
  });

  it('submit button enables once both fields are filled', async () => {
    const user = userEvent.setup();
    render(<Login />);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'secret');

    expect(screen.getByRole('button', { name: /log in/i })).toBeEnabled();
  });

  it('calls login() with username and password on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValueOnce({});
    render(<Login />);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(login).toHaveBeenCalledWith('alice', 'secret');
  });

  it('navigates to gardens on successful login', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockResolvedValueOnce({});
    render(<Login />);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'secret');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/gardens'));
  });

  it('shows a root error message on API failure', async () => {
    const user = userEvent.setup();
    vi.mocked(login).mockRejectedValueOnce({ isAxiosError: true, response: { data: { detail: 'Invalid credentials.' } } });
    render(<Login />);

    await user.type(screen.getByLabelText(/username/i), 'alice');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByText('Invalid credentials.')).toBeInTheDocument());
  });

  it('has a link to the register page', () => {
    render(<Login />);
    expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
  });

  it('shows the password reset success banner when passwordReset state is true', () => {
    renderWithState({ passwordReset: true });
    expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
  });

  it('clears the passwordReset location state on mount', () => {
    renderWithState({ passwordReset: true });
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true, state: {} });
  });
});
