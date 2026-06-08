import type { BasePlacement } from '@/types/gardens';

export type PlantCategory = "vegetable" | "herb" | "fruit" | "flower" | "other";

export type UserPlantStatus = "planned" | "planted" | "growing" | "fruiting" | "dormant" | "removed";

export type ObservationType = "status_change" | "transplant" | "harvest" | "pest" | "weather" | "disease" | "general";

export interface Observation {
  id: string;
  userPlant: string;
  observedDate: string;
  type: ObservationType;
  note: string;
  previousStatus: UserPlantStatus | "";
  newStatus: UserPlantStatus | "";
  createdAt: string;
  updatedAt: string;
}

export interface Plant {
  id: string;
  commonName: string;
  scientificName: string;
  category: PlantCategory;
  description: string;
  defaultSpacingFt: number | null;
}

export interface UserPlant {
  id: string;
  bed: string;
  bedName: string;
  gardenId: string;
  gardenName: string;
  plant: string;
  plantName: string;
  plantCategory: PlantCategory;
  plantDefaultSpacingFt: number | null;
  placementId: string | null;
  variety: string;
  startDate: string | null;
  status: UserPlantStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type UserPlantPayload = {
  plant: string;
  status: UserPlantStatus;
  variety?: string;
  startDate?: string;
  notes?: string;
  quantity?: number;
};

export type CompanionRelationship = "beneficial" | "harmful";

export interface CompanionHint {
  plantAId: string;
  plantAName: string;
  plantBId: string;
  plantBName: string;
  relationship: CompanionRelationship;
  notes: string;
}

export type PlantPlacement = BasePlacement & {
  userPlant: string;
  bed: string;
  width: number;
  height: number;
};

export interface CalendarObservation {
  id: string;
  observedDate: string;
  type: ObservationType;
  note: string;
  previousStatus: UserPlantStatus | "";
  newStatus: UserPlantStatus | "";
}

export interface CalendarPlant {
  id: string;
  bed: string;
  bedName: string;
  gardenId: string;
  gardenName: string;
  plant: string;
  plantName: string;
  plantCategory: PlantCategory;
  variety: string;
  startDate: string;
  status: UserPlantStatus;
  observations: CalendarObservation[];
}

export const PLANT_CATEGORIES = [
  { value: "vegetable", label: "Vegetable" },
  { value: "herb", label: "Herb" },
  { value: "fruit", label: "Fruit" },
  { value: "flower", label: "Flower" },
  { value: "other", label: "Other" },
] as const;

export const USER_PLANT_STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "planted", label: "Planted" },
  { value: "growing", label: "Growing" },
  { value: "fruiting", label: "Fruiting" },
  { value: "dormant", label: "Dormant" },
  { value: "removed", label: "Removed" },
] as const;

export const OBSERVATION_TYPES = [
  { value: "harvest", label: "Harvest" },
  { value: "pest", label: "Pest" },
  { value: "weather", label: "Weather" },
  { value: "disease", label: "Disease" },
  { value: "general", label: "General" },
  { value: "status_change", label: "Status Change" },
  { value: "transplant", label: "Transplant" },
] as const;
