export const routes = {
  home: () => '/',
  login: () => '/login',
  register: () => '/register',
  gardens: () => '/gardens',
  gardenDetail: (id: string) => `/gardens/${id}`,
  allBeds: () => '/beds',
  bedDetail: (gardenId: string, bedId: string) => `/gardens/${gardenId}/beds/${bedId}`,
  allPlants: () => '/plants',
};
