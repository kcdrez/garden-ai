import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { register } from '@/api/auth';
import { mockNavigate } from '@/test/test-setup';
import Register from './Register';

vi.mock('@/api/auth', () => ({
  register: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(register).mockClear();
});

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: { username?: string; password?: string; confirm?: string } = {},
) {
  const { username = 'alice', password = 'securepass', confirm = 'securepass' } = overrides;
  await user.type(screen.getByLabelText(/username/i), username);
  await user.type(screen.getByLabelText(/^password$/i), password);
  await user.type(screen.getByLabelText(/confirm password/i), confirm);
}

describe('Register', () => {
  it('renders all four fields', () => {
    render(<Register />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('submit button is disabled when form is empty', () => {
    render(<Register />);
    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
  });

  it('shows a password mismatch error when passwords differ', async () => {
    const user = userEvent.setup();
    render(<Register />);

    await fillForm(user, { password: 'password1', confirm: 'password2' });

    await waitFor(() => expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument());
  });

  it('submit button enables when required fields are valid', async () => {
    const user = userEvent.setup();
    render(<Register />);

    await fillForm(user);

    expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled();
  });

  it('calls register() with correct args on submit', async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockResolvedValueOnce({});
    render(<Register />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(register).toHaveBeenCalledWith('alice', 'securepass', 'securepass', undefined);
  });

  it('navigates to gardens on successful registration', async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockResolvedValueOnce({});
    render(<Register />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/gardens'));
  });

  it('shows a root error message on API failure', async () => {
    const user = userEvent.setup();
    vi.mocked(register).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { detail: 'Username already taken.' } },
    });
    render(<Register />);

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(screen.getByText('Username already taken.')).toBeInTheDocument());
  });

  it('has a link to the login page', () => {
    render(<Register />);
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
  });
});
