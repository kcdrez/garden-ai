import type { UserPlantStatus } from '@/types/plants';
import { statusLabel } from './plants';

describe('statusLabel', () => {
  it('returns the display label for a known status', () => {
    expect(statusLabel('growing')).toBe('Growing');
    expect(statusLabel('planned')).toBe('Planned');
  });

  it('returns the raw status string for an unknown status', () => {
    expect(statusLabel('unknown_status' as UserPlantStatus)).toBe('unknown_status');
  });
});
