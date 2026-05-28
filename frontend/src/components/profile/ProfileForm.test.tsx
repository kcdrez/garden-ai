import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { updateProfile } from '@/api/auth';
import { mockProfile } from '@/test/fixtures';
import ProfileForm from './ProfileForm';

vi.mock('@/api/auth', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(updateProfile).mockResolvedValue(mockProfile);
});

describe('ProfileForm', () => {
  it('renders all editable fields', () => {
    render(<ProfileForm profile={mockProfile} />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
  });

  it('pre-populates fields from the profile', () => {
    render(<ProfileForm profile={mockProfile} />);

    expect(screen.getByLabelText(/first name/i)).toHaveValue('Alice');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Smith');
    expect(screen.getByLabelText(/email/i)).toHaveValue('alice@example.com');
  });

  it('disables Save and Cancel when form is not dirty', () => {
    render(<ProfileForm profile={mockProfile} />);

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('enables Save and Cancel after a field is changed', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} />);

    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Bob');

    expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled();
  });

  it('resets to original values on Cancel', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} />);

    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Bob');
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByLabelText(/first name/i)).toHaveValue('Alice');
  });

  it('calls updateProfile and resets the form on successful submit', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} />);

    await user.clear(screen.getByLabelText(/first name/i));
    await user.type(screen.getByLabelText(/first name/i), 'Bob');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
    );
  });

  it('shows a validation error for an invalid email', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'not-an-email');

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});
