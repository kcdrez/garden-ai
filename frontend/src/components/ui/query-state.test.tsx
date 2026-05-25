import { render, screen } from '@/test/test-utils';
import { QueryState, LoadingSpinner } from './query-state';

describe('LoadingSpinner', () => {
  it('renders loading text', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

describe('QueryState', () => {
  it('shows the spinner while loading', () => {
    render(
      <QueryState isLoading error={null}>
        <span>content</span>
      </QueryState>,
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows the error message when an error is present', () => {
    render(
      <QueryState isLoading={false} error={new Error('something broke')}>
        <span>content</span>
      </QueryState>,
    );
    expect(screen.getByText(/something broke/i)).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows the default empty message when isEmpty is true', () => {
    render(
      <QueryState isLoading={false} error={null} isEmpty>
        <span>content</span>
      </QueryState>,
    );
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows a custom empty message', () => {
    render(
      <QueryState isLoading={false} error={null} isEmpty emptyMessage="No gardens yet.">
        <span>content</span>
      </QueryState>,
    );
    expect(screen.getByText('No gardens yet.')).toBeInTheDocument();
  });

  it('renders children when not loading, no error, and not empty', () => {
    render(
      <QueryState isLoading={false} error={null}>
        <span>The content</span>
      </QueryState>,
    );
    expect(screen.getByText('The content')).toBeInTheDocument();
  });
});
