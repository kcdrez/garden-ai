import type { UserPlantStatus } from '@/types/plants';
import { USER_PLANT_STATUSES } from '@/types/plants';

export const STATUS_CLASSES: Record<UserPlantStatus, string> = {
  planned: 'bg-muted text-muted-foreground',
  planted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  growing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  fruiting: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  dormant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  removed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function statusLabel(status: UserPlantStatus): string {
  return USER_PLANT_STATUSES.find((s) => s.value === status)?.label ?? status;
}
