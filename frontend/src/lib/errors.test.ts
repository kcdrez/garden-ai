import { getErrorMessage, getDRFFieldErrors, applyServerErrors } from '@/lib/errors';
import type { UseFormReturn } from 'react-hook-form';

// Axios checks `err.isAxiosError === true` in isAxiosError()
function makeAxiosError(data: unknown) {
  return { isAxiosError: true, response: { data } };
}

describe('getErrorMessage', () => {
  it('returns detail string from axios error', () => {
    const err = makeAxiosError({ detail: 'Not found.' });
    expect(getErrorMessage(err)).toBe('Not found.');
  });

  it('joins nonFieldErrors array', () => {
    const err = makeAxiosError({ nonFieldErrors: ['Error A.', 'Error B.'] });
    expect(getErrorMessage(err)).toBe('Error A. Error B.');
  });

  it('joins all field error arrays when no detail or nonFieldErrors', () => {
    const err = makeAxiosError({ username: ['Already taken.'], email: ['Invalid.'] });
    expect(getErrorMessage(err)).toContain('Already taken.');
    expect(getErrorMessage(err)).toContain('Invalid.');
  });

  it('returns fallback for axios error with no response data', () => {
    const err = { isAxiosError: true, response: undefined };
    expect(getErrorMessage(err)).toBe('An unexpected error occurred');
  });

  it('returns message from plain Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns string directly', () => {
    expect(getErrorMessage('something went wrong')).toBe('something went wrong');
  });

  it('returns fallback for unknown types', () => {
    expect(getErrorMessage(42)).toBe('An unexpected error occurred');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
  });
});

describe('getDRFFieldErrors', () => {
  it('returns field error map for field-keyed errors', () => {
    const err = makeAxiosError({ username: ['Already taken.'] });
    const result = getDRFFieldErrors(err);
    expect(result).toEqual({ username: ['Already taken.'] });
  });

  it('returns null when error has a detail key', () => {
    const err = makeAxiosError({ detail: 'Not found.' });
    expect(getDRFFieldErrors(err)).toBeNull();
  });

  it('returns null when error has nonFieldErrors', () => {
    const err = makeAxiosError({ nonFieldErrors: ['Some error.'] });
    expect(getDRFFieldErrors(err)).toBeNull();
  });

  it('returns null for non-axios errors', () => {
    expect(getDRFFieldErrors(new Error('boom'))).toBeNull();
  });
});

describe('applyServerErrors', () => {
  function makeForm() {
    return {
      setError: vi.fn(),
    } as unknown as UseFormReturn<{ username: string; password: string }>;
  }

  it('sets field error when server returns a matching field', () => {
    const form = makeForm();
    const err = makeAxiosError({ username: ['Already taken.'] });
    applyServerErrors(err, form, ['username', 'password'] as const);
    expect(form.setError).toHaveBeenCalledWith('username', { message: 'Already taken.' });
  });

  it('sets root error when no field matches', () => {
    const form = makeForm();
    const err = makeAxiosError({ email: ['Already registered.'] });
    applyServerErrors(err, form, ['username', 'password'] as const);
    expect(form.setError).toHaveBeenCalledWith('root', expect.objectContaining({ message: expect.any(String) }));
  });

  it('sets root error for non-field server errors', () => {
    const form = makeForm();
    const err = makeAxiosError({ detail: 'Unauthorized.' });
    applyServerErrors(err, form, ['username', 'password'] as const);
    expect(form.setError).toHaveBeenCalledWith('root', { message: 'Unauthorized.' });
  });
});
