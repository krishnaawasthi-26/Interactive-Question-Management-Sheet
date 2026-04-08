import { PUBLIC_SHEET_API_BASE_URL } from "../../config/apiConfig";

export const fetchRemoteSheetBySlug = async (slug) => {
  const response = await fetch(`${PUBLIC_SHEET_API_BASE_URL}/${slug}`);
  if (!response.ok) {
    throw new Error("Failed to fetch sheet");
  }

  const data = await response.json();
  return data?.data?.sheet ?? data?.data ?? data?.sheet ?? data;
};
