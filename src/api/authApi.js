import { apiRequest } from "./apiClient";

export const authRequest = (path, method = "GET", body, token) =>
  apiRequest(path, { method, body, token, rateLimit: true });

export const signUpUser = (payload) => authRequest("/api/auth/signup", "POST", payload);
export const resendSignUpOtp = (payload) => authRequest("/api/auth/signup/resend-otp", "POST", payload);
export const verifySignUpOtp = (payload) => authRequest("/api/auth/signup/verify-otp", "POST", payload);
export const loginUser = (payload) => authRequest("/api/auth/login", "POST", payload);
export const googleAuth = (payload) => authRequest("/api/auth/google", "POST", payload);
