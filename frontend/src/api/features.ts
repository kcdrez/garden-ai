import { api } from './client';
import type { FeatureObjectType, GardenFeaturePlacement } from '@/types/gardens';

type FeaturePayload = {
  objectType: FeatureObjectType;
  label?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
};

type FeatureMovePayload = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label?: string;
  rotation?: number;
};

export async function fetchGardenFeatures(gardenId: string): Promise<GardenFeaturePlacement[]> {
  const { data } = await api.get<GardenFeaturePlacement[]>(`/gardens/${gardenId}/features/`);
  return data ?? [];
}

export async function createGardenFeature(
  gardenId: string,
  payload: FeaturePayload,
): Promise<GardenFeaturePlacement> {
  const { data } = await api.post<GardenFeaturePlacement>(`/gardens/${gardenId}/features/`, payload);
  return data;
}

export async function updateGardenFeature(
  gardenId: string,
  featureId: string,
  payload: FeatureMovePayload,
): Promise<GardenFeaturePlacement> {
  const { data } = await api.patch<GardenFeaturePlacement>(
    `/gardens/${gardenId}/features/${featureId}/`,
    payload,
  );
  return data;
}

export async function deleteGardenFeature(gardenId: string, featureId: string): Promise<void> {
  await api.delete(`/gardens/${gardenId}/features/${featureId}/`);
}

export async function fetchBedFeatures(
  gardenId: string,
  bedId: string,
): Promise<GardenFeaturePlacement[]> {
  const { data } = await api.get<GardenFeaturePlacement[]>(
    `/gardens/${gardenId}/beds/${bedId}/features/`,
  );
  return data ?? [];
}

export async function createBedFeature(
  gardenId: string,
  bedId: string,
  payload: FeaturePayload,
): Promise<GardenFeaturePlacement> {
  const { data } = await api.post<GardenFeaturePlacement>(
    `/gardens/${gardenId}/beds/${bedId}/features/`,
    payload,
  );
  return data;
}

export async function updateBedFeature(
  gardenId: string,
  bedId: string,
  featureId: string,
  payload: FeatureMovePayload,
): Promise<GardenFeaturePlacement> {
  const { data } = await api.patch<GardenFeaturePlacement>(
    `/gardens/${gardenId}/beds/${bedId}/features/${featureId}/`,
    payload,
  );
  return data;
}

export async function deleteBedFeature(
  gardenId: string,
  bedId: string,
  featureId: string,
): Promise<void> {
  await api.delete(`/gardens/${gardenId}/beds/${bedId}/features/${featureId}/`);
}
