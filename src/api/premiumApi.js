import { authRequest } from "./authApi";

export const fetchPremiumPlans = () => authRequest("/api/premium/plans");
export const createPremiumOrder = (token, plan) =>
  authRequest("/api/premium/create-order", "POST", { plan }, token);

export const verifyPremiumPayment = (token, payload) =>
  authRequest("/api/premium/verify", "POST", payload, token);
