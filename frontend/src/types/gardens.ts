export type Garden = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: number;
};

export type BedUnit = 'in' | 'ft' | 'cm' | 'm';

export const BED_UNITS: { value: BedUnit; label: string }[] = [
  { value: 'in', label: 'Inches' },
  { value: 'ft', label: 'Feet' },
  { value: 'cm', label: 'Centimeters' },
  { value: 'm', label: 'Meters' },
];

export type BedFacing = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export const BED_FACINGS: { value: BedFacing; label: string }[] = [
  { value: 'N', label: 'North' },
  { value: 'NE', label: 'Northeast' },
  { value: 'E', label: 'East' },
  { value: 'SE', label: 'Southeast' },
  { value: 'S', label: 'South' },
  { value: 'SW', label: 'Southwest' },
  { value: 'W', label: 'West' },
  { value: 'NW', label: 'Northwest' },
];

export type GardenBed = {
  id: string;
  garden: string;
  name: string;
  length: number;
  width: number;
  depth?: number | null;
  unit: BedUnit;
  facing?: BedFacing | null;
  avgSunlightHours?: number | null;
  soilType?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};
