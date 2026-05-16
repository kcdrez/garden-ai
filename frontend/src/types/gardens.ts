export type Garden = {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
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
  avg_sunlight_hours?: number | null;
  soil_type?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};
