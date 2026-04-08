import { apiRequest } from "./apiClient";

export const authRequest = (path, method = "GET", body, token) =>
  apiRequest(path, { method, body, token, rateLimit: true });

export const signUpUser = (payload) => authRequest("/api/auth/signup", "POST", payload);

export const loginUser = (payload) => authRequest("/api/auth/login", "POST", payload);
