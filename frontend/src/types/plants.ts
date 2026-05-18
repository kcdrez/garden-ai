export type PlantCategory = "vegetable" | "herb" | "fruit" | "flower" | "other";

export type UserPlantStatus = "planned" | "planted" | "growing" | "harvested" | "removed";

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
  plantedDate: string | null;
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
  { value: "harvested", label: "Harvested" },
  { value: "removed", label: "Removed" },
];
