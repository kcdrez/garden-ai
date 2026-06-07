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
};

export async function fetchGardenFeatures(gardenId: string): Promise<GardenFeaturePlacement[]> {
  const res = await api.get(`/gardens/${gardenId}/features/`);
  return res.data ?? [];
}

export async function createGardenFeature(gardenId: string, data: FeaturePayload): Promise<GardenFeaturePlacement> {
  const res = await api.post(`/gardens/${gardenId}/features/`, data);
  return res.data;
}

export async function updateGardenFeature(
  gardenId: string,
  featureId: string,
  data: FeatureMovePayload,
): Promise<GardenFeaturePlacement> {
  const res = await api.patch(`/gardens/${gardenId}/features/${featureId}/`, data);
  return res.data;
}

export async function deleteGardenFeature(gardenId: string, featureId: string): Promise<void> {
  await api.delete(`/gardens/${gardenId}/features/${featureId}/`);
}

export async function fetchBedFeatures(gardenId: string, bedId: string): Promise<GardenFeaturePlacement[]> {
  const res = await api.get(`/gardens/${gardenId}/beds/${bedId}/features/`);
  return res.data ?? [];
}

export async function createBedFeature(
  gardenId: string,
  bedId: string,
  data: FeaturePayload,
): Promise<GardenFeaturePlacement> {
  const res = await api.post(`/gardens/${gardenId}/beds/${bedId}/features/`, data);
  return res.data;
}

export async function updateBedFeature(
  gardenId: string,
  bedId: string,
  featureId: string,
  data: FeatureMovePayload,
): Promise<GardenFeaturePlacement> {
  const res = await api.patch(`/gardens/${gardenId}/beds/${bedId}/features/${featureId}/`, data);
  return res.data;
}

export async function deleteBedFeature(gardenId: string, bedId: string, featureId: string): Promise<void> {
  await api.delete(`/gardens/${gardenId}/beds/${bedId}/features/${featureId}/`);
}
