import { api } from "./api";

const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });
  return search.toString();
};

export const schemeService = {
  list: (params) => api.get(`/schemes?${query(params)}`),
  get: (id, language = "en") => api.get(`/schemes/${id}?language=${language}`),
  recommend: (payload) => api.post("/schemes/recommend", payload),
  saved: () => api.get("/farmer/saved-schemes"),
  save: (schemeId) => api.post("/farmer/saved-schemes", { scheme_id: schemeId }),
  unsave: (schemeId) => api.delete(`/farmer/saved-schemes/${schemeId}`),
};
