export type PlantCategory = "vegetable" | "herb" | "fruit" | "flower" | "other";

export type UserPlantStatus = "planned" | "planted" | "growing" | "harvested" | "removed";

export interface Plant {
  id: string;
  common_name: string;
  scientific_name: string;
  category: PlantCategory;
  description: string;
}

export interface UserPlant {
  id: string;
  bed: string;
  plant: string;
  plant_name: string;
  plant_category: PlantCategory;
  variety: string;
  planted_date: string | null;
  status: UserPlantStatus;
  notes: string;
  created_at: string;
  updated_at: string;
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
  { value: "harvested", label: "Harvested" },
  { value: "removed", label: "Removed" },
];
