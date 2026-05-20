export type PlantCategory = "vegetable" | "herb" | "fruit" | "flower" | "other";

export type UserPlantStatus = "planned" | "planted" | "growing" | "fruiting" | "dormant" | "removed";

export type ObservationType = "status_change" | "harvest" | "pest" | "weather" | "disease" | "general";

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
  variety: string;
  startDate: string | null;
  status: UserPlantStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const PLANT_CATEGORIES: { value: PlantCategory; label: string }[] = [
  { value: "vegetable", label: "Vegetable" },
  { value: "herb", label: "Herb" },
  { value: "fruit", label: "Fruit" },
  { value: "flower", label: "Flower" },
  { value: "other", label: "Other" },
];

export const USER_PLANT_STATUSES: { value: UserPlantStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "planted", label: "Planted" },
  { value: "growing", label: "Growing" },
  { value: "fruiting", label: "Fruiting" },
  { value: "dormant", label: "Dormant" },
  { value: "removed", label: "Removed" },
];

export const OBSERVATION_TYPES: { value: ObservationType; label: string }[] = [
  { value: "harvest", label: "Harvest" },
  { value: "pest", label: "Pest" },
  { value: "weather", label: "Weather" },
  { value: "disease", label: "Disease" },
  { value: "general", label: "General" },
  { value: "status_change", label: "Status Change" },
];
