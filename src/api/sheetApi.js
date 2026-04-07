import { authRequest } from "./authApi";

export const listSheets = (token) => authRequest("/api/sheets", "GET", null, token);
export const createSheet = (token, title) => authRequest("/api/sheets", "POST", { title }, token);
export const getSheet = (token, sheetId) => authRequest(`/api/sheets/${sheetId}`, "GET", null, token);
export const saveSheet = (token, sheetId, payload) =>
  authRequest(`/api/sheets/${sheetId}`, "PUT", payload, token);
export const removeSheet = (token, sheetId) => authRequest(`/api/sheets/${sheetId}`, "DELETE", null, token);
export const getSharedSheet = (shareId) => authRequest(`/api/sheets/shared/${shareId}`);
export const trackSheetEngagement = (token, sheetId, action) =>
  authRequest(`/api/sheets/${sheetId}/engagement`, "POST", { action }, token);
