import '@testing-library/jest-dom';

export const mockNavigate = vi.fn();
export const mockUseParams = vi.fn().mockReturnValue({});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: mockUseParams };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUseParams.mockReturnValue({});
});
