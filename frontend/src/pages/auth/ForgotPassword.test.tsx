import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { forgotPassword } from '@/api/auth';
import ForgotPassword from './ForgotPassword';

vi.mock('@/api/auth', () => ({
  forgotPassword: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(forgotPassword).mockClear();
});

describe('ForgotPassword', () => {
  it('renders the email field', () => {
    render(<ForgotPassword />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('submit button is disabled when email is empty', () => {
    render(<ForgotPassword />);
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeDisabled();
  });

  it('submit button enables when a valid email is entered', async () => {
    const user = userEvent.setup();
    render(<ForgotPassword />);

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');

    expect(screen.getByRole('button', { name: /send reset link/i })).toBeEnabled();
  });

  it('calls forgotPassword() with the entered email on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockResolvedValueOnce({});
    render(<ForgotPassword />);

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(forgotPassword).toHaveBeenCalledWith('alice@example.com');
  });

  it('shows a success message after submission', async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockResolvedValueOnce({});
    render(<ForgotPassword />);

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => expect(screen.getByText(/check your email/i)).toBeInTheDocument());
  });

  it('shows a root error on API failure', async () => {
    const user = userEvent.setup();
    vi.mocked(forgotPassword).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { detail: 'Something went wrong.' } },
    });
    render(<ForgotPassword />);

    await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => expect(screen.getByText('Something went wrong.')).toBeInTheDocument());
  });

  it('has a link to the login page', () => {
    render(<ForgotPassword />);
    expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
  });
});
