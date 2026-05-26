import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { resetPassword } from '@/api/auth';
import { mockNavigate } from '@/test/test-setup';
import ResetPassword from './ResetPassword';

vi.mock('@/api/auth', () => ({
  resetPassword: vi.fn(),
}));

const { mockUseSearchParams } = vi.hoisted(() => ({ mockUseSearchParams: vi.fn() }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: vi.fn().mockReturnValue({}),
    useSearchParams: mockUseSearchParams,
  };
});

beforeEach(() => {
  vi.mocked(resetPassword).mockClear();
  mockUseSearchParams.mockReturnValue([new URLSearchParams({ uid: 'abc123', token: 'tok456' })]);
});

describe('ResetPassword', () => {
  it('shows an error state when uid or token is missing', () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
    render(<ResetPassword />);
    expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();
  });

  it('renders new password and confirm fields when params are present', () => {
    render(<ResetPassword />);
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('submit button is disabled when fields are empty', () => {
    render(<ResetPassword />);
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();
  });

  it('calls resetPassword() with uid, token, and new password on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(resetPassword).mockResolvedValueOnce({});
    render(<ResetPassword />);

    await user.type(screen.getByLabelText(/^new password$/i), 'newpassword1');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    expect(resetPassword).toHaveBeenCalledWith('abc123', 'tok456', 'newpassword1');
  });

  it('navigates to login on success', async () => {
    const user = userEvent.setup();
    vi.mocked(resetPassword).mockResolvedValueOnce({});
    render(<ResetPassword />);

    await user.type(screen.getByLabelText(/^new password$/i), 'newpassword1');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { passwordReset: true } }));
  });

  it('shows a root error on API failure', async () => {
    const user = userEvent.setup();
    vi.mocked(resetPassword).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { detail: 'Invalid or expired reset link.' } },
    });
    render(<ResetPassword />);

    await user.type(screen.getByLabelText(/^new password$/i), 'newpassword1');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword1');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => expect(screen.getByText('Invalid or expired reset link.')).toBeInTheDocument());
  });
});
