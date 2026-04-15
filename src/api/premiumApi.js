import { authRequest } from "./authApi";

export const fetchPremiumPlans = () => authRequest("/api/premium/plans");
export const fetchPremiumStatus = (token) => authRequest("/api/premium/status", "GET", undefined, token);
export const createPremiumOrder = (token, plan) =>
  authRequest("/api/payments/razorpay/order", "POST", { plan }, token);

export const verifyPremiumPayment = (token, payload) =>
  authRequest("/api/payments/razorpay/verify", "POST", payload, token);
