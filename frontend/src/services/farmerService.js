import { api } from "./api";

export const farmerService = {
  dashboard: () => api.get("/farmer/dashboard"),
  profile: () => api.get("/farmer/profile"),
  update: (payload) => api.put("/farmer/profile", payload),
  updateFarm: (payload) => api.put("/farmer/profile/details", payload),
  savedSchemes: () => api.get("/farmer/saved-schemes"),
};
