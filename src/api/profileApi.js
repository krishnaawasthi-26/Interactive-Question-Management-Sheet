import { authRequest } from "./authApi";

export const fetchProfile = (token) => authRequest("/api/profile", "GET", null, token);
export const updateProfile = (token, payload) => authRequest("/api/profile", "PUT", payload, token);
export const fetchSharedProfile = (profileShareId) => authRequest(`/api/profile/shared/${profileShareId}`);
export const fetchPublicProfile = (username) => authRequest(`/api/profile/public/${username}`);
export const fetchViewerPublicProfile = (token, username) => authRequest(`/api/profile/view/${username}`, "GET", null, token);
export const fetchPublicSheet = (username, sheetSlug) =>
  authRequest(`/api/profile/public/${username}/${sheetSlug}`);
export const followUser = (token, username) =>
  authRequest(`/api/profile/follow/${username}`, "POST", null, token);
export const unfollowUser = (token, username) =>
  authRequest(`/api/profile/follow/${username}`, "DELETE", null, token);
