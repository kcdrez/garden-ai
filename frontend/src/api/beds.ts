import { api } from './client';
import type { BedPlacement, GardenBed } from '@/types/gardens';

type BedPayload = {
  name: string;
  length: number;
  width: number;
  depth?: number;
  unit: string;
  orientation?: number;
  avgSunlightHours?: number;
  soilType?: string;
  notes?: string;
};

export async function fetchAllBeds(): Promise<GardenBed[]> {
  const { data } = await api.get<GardenBed[]>('/beds/');
  return data ?? [];
}

export async function fetchBeds(gardenId: string): Promise<GardenBed[]> {
  const { data } = await api.get<GardenBed[]>(`/gardens/${gardenId}/beds/`);
  return data ?? [];
}

export async function fetchBed(gardenId: string, bedId: string): Promise<GardenBed> {
  const { data } = await api.get<GardenBed>(`/gardens/${gardenId}/beds/${bedId}/`);
  return data;
}

export async function createBed(gardenId: string, payload: BedPayload): Promise<GardenBed> {
  const { data } = await api.post<GardenBed>(`/gardens/${gardenId}/beds/`, payload);
  return data;
}

export async function updateBed(
  gardenId: string,
  bedId: string,
  payload: Partial<BedPayload>,
): Promise<GardenBed> {
  const { data } = await api.patch<GardenBed>(`/gardens/${gardenId}/beds/${bedId}/`, payload);
  return data;
}

export async function deleteBed(gardenId: string, bedId: string): Promise<void> {
  await api.delete(`/gardens/${gardenId}/beds/${bedId}/`);
}

export async function fetchBedPlacements(gardenId: string): Promise<BedPlacement[]> {
  const { data } = await api.get<BedPlacement[]>(`/gardens/${gardenId}/bed-placements/`);
  return data ?? [];
}

export async function createBedPlacement(
  gardenId: string,
  payload: { bed: string; x: number; y: number; width?: number; height?: number },
): Promise<BedPlacement> {
  const { data } = await api.post<BedPlacement>(`/gardens/${gardenId}/bed-placements/`, payload);
  return data;
}

export async function moveBedPlacement(
  gardenId: string,
  placementId: string,
  x: number,
  y: number,
): Promise<BedPlacement> {
  const { data } = await api.patch<BedPlacement>(
    `/gardens/${gardenId}/bed-placements/${placementId}/`,
    { x, y },
  );
  return data;
}

export async function rotateBedPlacement(
  gardenId: string,
  placementId: string,
  rotation: number,
): Promise<BedPlacement> {
  const { data } = await api.patch<BedPlacement>(
    `/gardens/${gardenId}/bed-placements/${placementId}/`,
    { rotation },
  );
  return data;
}

export async function deleteBedPlacement(gardenId: string, placementId: string): Promise<void> {
  await api.delete(`/gardens/${gardenId}/bed-placements/${placementId}/`);
}
