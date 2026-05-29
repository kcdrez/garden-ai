import { api } from './client';
import type { Observation, Plant, PlantPlacement, UserPlant, UserPlantPayload } from '@/types/plants';
import type { ObservationFormValues } from '@/schemas/plants';

export async function fetchPlants(): Promise<Plant[]> {
  const res = await api.get('/plants/');
  return res.data;
}

export async function fetchAllUserPlants(): Promise<UserPlant[]> {
  const res = await api.get('/userplants/');
  return res.data ?? [];
}

export async function fetchUserPlant(plantId: string): Promise<UserPlant> {
  const res = await api.get(`/userplants/${plantId}/`);
  return res.data;
}

export async function fetchUserPlants(gardenId: string, bedId: string): Promise<UserPlant[]> {
  const res = await api.get(`/gardens/${gardenId}/beds/${bedId}/plants/`);
  return res.data;
}

export async function createUserPlant(
  gardenId: string,
  bedId: string,
  data: UserPlantPayload,
): Promise<UserPlant[]> {
  const res = await api.post(`/gardens/${gardenId}/beds/${bedId}/plants/`, data);
  return res.data;
}

export async function updateUserPlant(
  gardenId: string,
  bedId: string,
  plantId: string,
  data: Partial<UserPlantPayload>,
): Promise<UserPlant> {
  const res = await api.patch(`/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/`, data);
  return res.data;
}

export async function moveUserPlant(
  gardenId: string,
  bedId: string,
  plantId: string,
  targetBedId: string,
): Promise<UserPlant> {
  const res = await api.patch(`/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/`, { bed: targetBedId });
  return res.data;
}

export async function cloneUserPlant(
  gardenId: string,
  bedId: string,
  plantId: string,
  placement?: { x: number; y: number; width: number; height: number },
): Promise<UserPlant> {
  const res = await api.post(`/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/clone/`, placement ?? {});
  return res.data;
}

export async function deleteUserPlant(
  gardenId: string,
  bedId: string,
  plantId: string,
): Promise<void> {
  await api.delete(`/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/`);
}

export async function fetchPlacements(gardenId: string, bedId: string): Promise<PlantPlacement[]> {
  const res = await api.get(`/gardens/${gardenId}/beds/${bedId}/placements/`);
  return res.data;
}

export async function createPlacement(
  gardenId: string,
  bedId: string,
  data: { userPlant: string; x: number; y: number; width?: number; height?: number },
): Promise<PlantPlacement> {
  const res = await api.post(`/gardens/${gardenId}/beds/${bedId}/placements/`, data);
  return res.data;
}

export async function movePlacement(
  gardenId: string,
  bedId: string,
  placementId: string,
  x: number,
  y: number,
): Promise<PlantPlacement> {
  const res = await api.patch(`/gardens/${gardenId}/beds/${bedId}/placements/${placementId}/`, { x, y });
  return res.data;
}

export async function resizePlacement(
  gardenId: string,
  bedId: string,
  placementId: string,
  widthFt: number,
  heightFt: number,
): Promise<PlantPlacement> {
  const res = await api.patch(
    `/gardens/${gardenId}/beds/${bedId}/placements/${placementId}/`,
    { width: widthFt, height: heightFt },
  );
  return res.data;
}

export async function deletePlacement(
  gardenId: string,
  bedId: string,
  placementId: string,
): Promise<void> {
  await api.delete(`/gardens/${gardenId}/beds/${bedId}/placements/${placementId}/`);
}

export async function fetchObservations(
  gardenId: string,
  bedId: string,
  plantId: string,
): Promise<Observation[]> {
  const res = await api.get(`/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/observations/`);
  return res.data;
}

export async function createObservation(
  gardenId: string,
  bedId: string,
  plantId: string,
  data: ObservationFormValues,
): Promise<Observation> {
  const res = await api.post(`/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/observations/`, data);
  return res.data;
}

export async function updateObservation(
  gardenId: string,
  bedId: string,
  plantId: string,
  observationId: string,
  data: { observedDate: string; note?: string },
): Promise<Observation> {
  const res = await api.patch(
    `/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/observations/${observationId}/`,
    data,
  );
  return res.data;
}

export async function deleteObservation(
  gardenId: string,
  bedId: string,
  plantId: string,
  observationId: string,
): Promise<void> {
  await api.delete(`/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/observations/${observationId}/`);
}
