import { api } from './client';
import type { CalendarPlant, CompanionHint, Observation, Plant, PlantPlacement, UserPlant, UserPlantPayload } from '@/types/plants';
import type { ObservationFormValues } from '@/schemas/plants';

export async function fetchCalendarPlants(year: number, gardenId?: string): Promise<CalendarPlant[]> {
  const params: Record<string, string> = { year: String(year) };
  if (gardenId) params.garden_id = gardenId;
  const { data } = await api.get<CalendarPlant[]>('/calendar/', { params });
  return data ?? [];
}

export async function fetchPlants(): Promise<Plant[]> {
  const { data } = await api.get<Plant[]>('/plants/');
  return data;
}

export async function fetchAllUserPlants(): Promise<UserPlant[]> {
  const { data } = await api.get<UserPlant[]>('/userplants/');
  return data ?? [];
}

export async function fetchUserPlant(plantId: string): Promise<UserPlant> {
  const { data } = await api.get<UserPlant>(`/userplants/${plantId}/`);
  return data;
}

export async function fetchUserPlants(gardenId: string, bedId: string): Promise<UserPlant[]> {
  const { data } = await api.get<UserPlant[]>(`/gardens/${gardenId}/beds/${bedId}/plants/`);
  return data;
}

export async function createUserPlant(
  gardenId: string,
  bedId: string,
  payload: UserPlantPayload,
): Promise<UserPlant[]> {
  const { data } = await api.post<UserPlant[]>(`/gardens/${gardenId}/beds/${bedId}/plants/`, payload);
  return data;
}

export async function updateUserPlant(
  gardenId: string,
  bedId: string,
  plantId: string,
  payload: Partial<UserPlantPayload>,
): Promise<UserPlant> {
  const { data } = await api.patch<UserPlant>(
    `/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/`,
    payload,
  );
  return data;
}

export async function moveUserPlant(
  gardenId: string,
  bedId: string,
  plantId: string,
  targetBedId: string,
): Promise<UserPlant> {
  const { data } = await api.patch<UserPlant>(
    `/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/`,
    { bed: targetBedId },
  );
  return data;
}

export async function cloneUserPlant(
  gardenId: string,
  bedId: string,
  plantId: string,
  placement?: { x: number; y: number; width: number; height: number },
): Promise<UserPlant> {
  const { data } = await api.post<UserPlant>(
    `/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/clone/`,
    placement ?? {},
  );
  return data;
}

export async function deleteUserPlant(
  gardenId: string,
  bedId: string,
  plantId: string,
): Promise<void> {
  await api.delete(`/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/`);
}

export async function fetchPlacements(gardenId: string, bedId: string): Promise<PlantPlacement[]> {
  const { data } = await api.get<PlantPlacement[]>(`/gardens/${gardenId}/beds/${bedId}/placements/`);
  return data;
}

export async function createPlacement(
  gardenId: string,
  bedId: string,
  payload: { userPlant: string; x: number; y: number; width?: number; height?: number },
): Promise<PlantPlacement> {
  const { data } = await api.post<PlantPlacement>(
    `/gardens/${gardenId}/beds/${bedId}/placements/`,
    payload,
  );
  return data;
}

export async function movePlacement(
  gardenId: string,
  bedId: string,
  placementId: string,
  x: number,
  y: number,
): Promise<PlantPlacement> {
  const { data } = await api.patch<PlantPlacement>(
    `/gardens/${gardenId}/beds/${bedId}/placements/${placementId}/`,
    { x, y },
  );
  return data;
}

export async function resizePlacement(
  gardenId: string,
  bedId: string,
  placementId: string,
  widthFt: number,
  heightFt: number,
): Promise<PlantPlacement> {
  const { data } = await api.patch<PlantPlacement>(
    `/gardens/${gardenId}/beds/${bedId}/placements/${placementId}/`,
    { width: widthFt, height: heightFt },
  );
  return data;
}

export async function rotatePlacement(
  gardenId: string,
  bedId: string,
  placementId: string,
  rotation: number,
): Promise<PlantPlacement> {
  const { data } = await api.patch<PlantPlacement>(
    `/gardens/${gardenId}/beds/${bedId}/placements/${placementId}/`,
    { rotation },
  );
  return data;
}

export async function deletePlacement(
  gardenId: string,
  bedId: string,
  placementId: string,
): Promise<void> {
  await api.delete(`/gardens/${gardenId}/beds/${bedId}/placements/${placementId}/`);
}

export async function fetchCompanionHints(gardenId: string, bedId: string): Promise<CompanionHint[]> {
  const { data } = await api.get<CompanionHint[]>(
    `/gardens/${gardenId}/beds/${bedId}/companion-hints/`,
  );
  return data;
}

export async function fetchObservations(
  gardenId: string,
  bedId: string,
  plantId: string,
): Promise<Observation[]> {
  const { data } = await api.get<Observation[]>(
    `/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/observations/`,
  );
  return data;
}

export async function createObservation(
  gardenId: string,
  bedId: string,
  plantId: string,
  payload: ObservationFormValues,
): Promise<Observation> {
  const { data } = await api.post<Observation>(
    `/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/observations/`,
    payload,
  );
  return data;
}

export async function updateObservation(
  gardenId: string,
  bedId: string,
  plantId: string,
  observationId: string,
  payload: { observedDate: string; note?: string },
): Promise<Observation> {
  const { data } = await api.patch<Observation>(
    `/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/observations/${observationId}/`,
    payload,
  );
  return data;
}

export async function deleteObservation(
  gardenId: string,
  bedId: string,
  plantId: string,
  observationId: string,
): Promise<void> {
  await api.delete(
    `/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/observations/${observationId}/`,
  );
}
