export function formatDate(iso: string, includeTime = false): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime && { hour: 'numeric', minute: '2-digit' }),
  });
}
