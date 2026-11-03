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

export const weatherService = {
  current: (params) => api.get(`/weather/current?${query(params)}`),
  forecast: (params) => api.get(`/weather/forecast?${query(params)}`),
  advisory: (payload) => api.post("/weather/advisory", payload),
};
