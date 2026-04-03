import { authRequest } from "./authApi";

export const fetchProfile = (token) => authRequest("/api/profile", "GET", null, token);
export const updateProfile = (token, payload) =>
  authRequest("/api/profile", "PUT", payload, token);
export const fetchSharedProfile = (profileShareId) =>
  authRequest(`/api/profile/shared/${profileShareId}`);
export const fetchPublicProfile = (username) =>
  authRequest(`/api/profile/public/${username}`);
export const fetchPublicSheet = (username, sheetSlug) =>
  authRequest(`/api/profile/public/${username}/${sheetSlug}`);
