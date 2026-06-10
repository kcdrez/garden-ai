import type { Garden, GardenBed } from '@/types/gardens';
import type { CalendarPlant, UserPlant } from '@/types/plants';
import type { UserProfile } from '@/types/auth';

export const mockProfile: UserProfile = {
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
  timezone: 'America/Denver',
};

export const mockGarden: Garden = {
  id: 'garden-1',
  name: 'Front Yard',
  description: 'My main garden',
  length: null,
  width: null,
  unit: 'ft',
  orientation: 0,
  bedCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  owner: 1,
};

export const mockBed: GardenBed = {
  id: 'bed-1',
  garden: 'garden-1',
  gardenName: 'Front Yard',
  name: 'Raised Bed 1',
  length: 4,
  width: 4,
  depth: null,
  unit: 'ft',
  orientation: 0,
  avgSunlightHours: null,
  soilType: null,
  notes: null,
  plantCount: 0,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockUserPlant: UserPlant = {
  id: 'plant-1',
  bed: 'bed-1',
  bedName: 'Raised Bed 1',
  gardenId: 'garden-1',
  gardenName: 'Front Yard',
  plant: 'catalog-1',
  plantName: 'Tomato',
  plantCategory: 'vegetable',
  plantDefaultSpacingFt: 1.5,
  placementId: null,
  variety: '',
  startDate: null,
  status: 'growing',
  notes: '',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const mockCalendarPlant: CalendarPlant = {
  id: 'plant-1',
  bed: 'bed-1',
  bedName: 'Raised Bed 1',
  gardenId: 'garden-1',
  gardenName: 'Front Yard',
  plant: 'catalog-1',
  plantName: 'Tomato',
  plantCategory: 'vegetable',
  variety: '',
  startDate: '2026-03-01',
  status: 'growing',
  observations: [
    {
      id: 'obs-1',
      observedDate: '2026-03-01',
      type: 'status_change',
      note: '',
      previousStatus: '',
      newStatus: 'planned',
    },
    {
      id: 'obs-2',
      observedDate: '2026-04-01',
      type: 'status_change',
      note: '',
      previousStatus: 'planned',
      newStatus: 'growing',
    },
  ],
};

export const mockBeds: GardenBed[] = [
  mockBed,
  { ...mockBed, id: 'bed-2', name: 'Raised Bed 2' },
  {
    ...mockBed,
    id: 'bed-3',
    garden: 'garden-2',
    gardenName: 'Back Yard',
    name: 'Back Bed',
  },
];
