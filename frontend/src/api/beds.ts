import { api } from './client';
import type { GardenBed } from '@/types/gardens';

type BedPayload = {
  name: string;
  length: number;
  width: number;
  depth?: number;
  unit: string;
  facing?: string;
  avg_sunlight_hours?: number;
  soil_type?: string;
  notes?: string;
};

export async function fetchBeds(gardenId: string): Promise<GardenBed[]> {
  const res = await api.get(`/gardens/${gardenId}/beds/`);
  return res.data ?? [];
}

export async function createBed(gardenId: string, data: BedPayload): Promise<GardenBed> {
  const res = await api.post(`/gardens/${gardenId}/beds/`, data);
  return res.data;
}

export async function updateBed(
  gardenId: string,
  bedId: string,
  data: Partial<BedPayload>,
): Promise<GardenBed> {
  const res = await api.patch(`/gardens/${gardenId}/beds/${bedId}/`, data);
  return res.data;
}

export async function deleteBed(gardenId: string, bedId: string): Promise<void> {
  await api.delete(`/gardens/${gardenId}/beds/${bedId}/`);
}
