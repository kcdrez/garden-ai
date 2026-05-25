import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { mockNavigate } from '@/test/test-setup';
import { auth } from '@/auth/auth';
import NavBar from './NavBar';

vi.mock('@/auth/auth', () => ({
  auth: { clearTokens: vi.fn() },
}));

const mockToggleTheme = vi.fn();
let mockIsDark = false;

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: mockIsDark, toggleTheme: mockToggleTheme }),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  DropdownMenuSeparator: () => <hr />,
}));

beforeEach(() => {
  mockIsDark = false;
});

describe('NavBar', () => {
  it('renders the app name link', () => {
    render(<NavBar />);
    expect(screen.getByRole('link', { name: /garden ai/i })).toBeInTheDocument();
  });

  it('renders navigation links for Gardens, Beds, and Plants', () => {
    render(<NavBar />);
    expect(screen.getByRole('link', { name: /^gardens$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^beds$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^plants$/i })).toBeInTheDocument();
  });

  it('clears tokens and navigates to /login when Logout is clicked', async () => {
    const user = userEvent.setup();
    render(<NavBar />);

    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(auth.clearTokens).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows Light mode option when dark mode is active', () => {
    mockIsDark = true;
    render(<NavBar />);

    expect(screen.getByText('Light mode')).toBeInTheDocument();
  });
});
