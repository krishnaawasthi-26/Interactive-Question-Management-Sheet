import { API_ENDPOINTS } from "../../config/apiConfig";
import { apiRequest } from "../apiClient";

export const fetchRemoteSheetBySlug = async (slug) => {
  const data = await apiRequest(`/${slug}`, {
    baseUrl: API_ENDPOINTS.publicSheetBySlug,
  });

  return data?.data?.sheet ?? data?.data ?? data?.sheet ?? data;
};
