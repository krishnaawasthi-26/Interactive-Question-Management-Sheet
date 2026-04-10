import { apiRequest } from "./apiClient";

export const authRequest = (path, method = "GET", body, token) =>
  apiRequest(path, { method, body, token, rateLimit: true });

export const requestSignUpOtp = (payload) => authRequest("/api/auth/signup/request-otp", "POST", payload);
export const verifySignUpOtp = (payload) => authRequest("/api/auth/signup/verify-otp", "POST", payload);
export const loginUser = (payload) => authRequest("/api/auth/login", "POST", payload);
export const loginWithGoogle = (payload) => authRequest("/api/auth/google", "POST", payload);
