import axios from 'axios';

type DRFErrors = Record<string, string[]>;

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(' ');
      if (typeof data === 'object') {
        const fieldMessages = Object.entries(data as DRFErrors)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
          .join('\n');
        if (fieldMessages) return fieldMessages;
      }
    }
  }
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'An unexpected error occurred';
}

export function getDRFFieldErrors(err: unknown): DRFErrors | null {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data && typeof data === 'object' && !data.detail && !data.non_field_errors) {
      return data as DRFErrors;
    }
  }
  return null;
}
