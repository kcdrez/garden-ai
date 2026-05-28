import { render, screen, waitFor } from '@/test/test-utils';
import { getProfile } from '@/api/auth';
import { mockProfile } from '@/test/fixtures';
import ProfilePage from './ProfilePage';

vi.mock('@/api/auth', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('@/components/profile/ProfileForm', () => ({
  default: ({ profile }: { profile: typeof mockProfile }) => (
    <div data-testid="profile-form">{profile.username}</div>
  ),
}));

describe('ProfilePage', () => {
  it('shows a loading spinner while fetching', () => {
    vi.mocked(getProfile).mockReturnValue(new Promise(() => {}));
    render(<ProfilePage />);
    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('renders username heading and profile form on success', async () => {
    vi.mocked(getProfile).mockResolvedValue(mockProfile);
    render(<ProfilePage />);
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /alice/i })).toBeInTheDocument()
    );
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
  });

  it('shows an error message on failure', async () => {
    vi.mocked(getProfile).mockRejectedValue(new Error('Network error'));
    render(<ProfilePage />);
    await waitFor(() =>
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    );
  });
});
