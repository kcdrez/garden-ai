import { api } from './client';
import type { Plant, UserPlant } from '@/types/plants';
import type { UserPlantFormValues } from '@/schemas/plants';

export async function fetchPlants(): Promise<Plant[]> {
  const res = await api.get('/plants/');
  return res.data;
}

export async function fetchAllUserPlants(): Promise<UserPlant[]> {
  const res = await api.get('/userplants/');
  return res.data ?? [];
}

export async function fetchUserPlants(gardenId: string, bedId: string): Promise<UserPlant[]> {
  const res = await api.get(`/gardens/${gardenId}/beds/${bedId}/plants/`);
  return res.data;
}

export async function createUserPlant(
  gardenId: string,
  bedId: string,
  data: UserPlantFormValues,
): Promise<UserPlant> {
  const res = await api.post(`/gardens/${gardenId}/beds/${bedId}/plants/`, data);
  return res.data;
}

export async function updateUserPlant(
  gardenId: string,
  bedId: string,
  plantId: string,
  data: Partial<UserPlantFormValues>,
): Promise<UserPlant> {
  const res = await api.patch(`/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/`, data);
  return res.data;
}

export async function deleteUserPlant(
  gardenId: string,
  bedId: string,
  plantId: string,
): Promise<void> {
  await api.delete(`/gardens/${gardenId}/beds/${bedId}/plants/${plantId}/`);
}
