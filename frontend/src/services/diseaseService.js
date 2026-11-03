import { api } from "./api";

export const diseaseService = {
  analyze: ({ file, cropName, location, language }) => {
    const formData = new FormData();
    formData.append("image", file);
    if (cropName) formData.append("crop_name", cropName);
    if (location) formData.append("location", location);
    formData.append("language", language || "en");
    return api.request("/disease/analyze", { method: "POST", formData });
  },
  history: (limit = 10) => api.get(`/disease/history?limit=${limit}`),
  reference: () => api.get("/disease/reference"),
};
