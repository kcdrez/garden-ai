export type Garden = {
  id: string;
  name: string;
  description: string | null;
  length: number | null;
  width: number | null;
  unit: BedUnit;
  bedCount: number;
  createdAt: string;
  updatedAt: string;
  owner: number;
};

export const BED_UNITS = [
  { value: 'in', label: 'Inches' },
  { value: 'ft', label: 'Feet' },
  { value: 'cm', label: 'Centimeters' },
  { value: 'm', label: 'Meters' },
] as const;

export type BedUnit = typeof BED_UNITS[number]['value'];

export const BED_FACINGS = [
  { value: 'N', label: 'North' },
  { value: 'NE', label: 'Northeast' },
  { value: 'E', label: 'East' },
  { value: 'SE', label: 'Southeast' },
  { value: 'S', label: 'South' },
  { value: 'SW', label: 'Southwest' },
  { value: 'W', label: 'West' },
  { value: 'NW', label: 'Northwest' },
] as const;

export type BedFacing = typeof BED_FACINGS[number]['value'];

export type BasePlacement = {
  id: string;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
};

export type BedPlacement = BasePlacement & {
  bed: string;
  garden: string;
  bedWidthFt: number;
  bedHeightFt: number;
};

export type FeatureObjectType =
  | 'shed' | 'bench' | 'arbor' | 'trellis' | 'fence' | 'compost'
  | 'rain_barrel' | 'cold_frame' | 'fountain' | 'bird_bath' | 'pot'
  | 'tomato_cage' | 'row_cover' | 'custom_rect' | 'custom_circle';

export type FeatureShape = 'rect' | 'circle';

export type GardenFeaturePlacement = BasePlacement & {
  objectType: FeatureObjectType;
  shape: FeatureShape;
  label: string;
  width: number;
  height: number;
};

export type GardenBed = {
  id: string;
  garden: string;
  gardenName: string;
  name: string;
  length: number;
  width: number;
  depth: number | null;
  unit: BedUnit;
  facing: BedFacing | null;
  avgSunlightHours: number | null;
  soilType: string | null;
  notes: string | null;
  plantCount: number;
  createdAt: string;
  updatedAt: string;
};
