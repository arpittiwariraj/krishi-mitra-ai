import { api } from "./api";

export const marketService = {
  crops: () => api.get("/market/crops"),
  prices: ({ crop, state, district }) => {
    const search = new URLSearchParams({ crop, state, district });
    return api.get(`/market/prices?${search.toString()}`);
  },
  compare: (payload) => api.post("/market/compare", payload),
};
