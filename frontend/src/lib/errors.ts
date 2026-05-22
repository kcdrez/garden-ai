import axios from 'axios';
import type { FieldValues, UseFormReturn, Path } from 'react-hook-form';

type DRFErrors = Record<string, string[]>;

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.nonFieldErrors)) return data.nonFieldErrors.join(' ');
      if (typeof data === 'object') {
        const messages = Object.values(data as DRFErrors)
          .flat()
          .join(' ');
        if (messages) return messages;
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
    if (data && typeof data === 'object' && !data.detail && !data.nonFieldErrors) {
      return data as DRFErrors;
    }
  }
  return null;
}

export function applyServerErrors<T extends FieldValues>(
  err: unknown,
  form: UseFormReturn<T>,
  fields: readonly Path<T>[],
): void {
  const fieldErrors = getDRFFieldErrors(err);
  if (fieldErrors) {
    fields.forEach((f) => {
      if (fieldErrors[f]) form.setError(f, { message: fieldErrors[f][0] });
    });
    if (!fields.some((f) => fieldErrors[f])) {
      form.setError('root', { message: getErrorMessage(err) });
    }
  } else {
    form.setError('root', { message: getErrorMessage(err) });
  }
}
