import { authRequest } from "./authApi";

export const fetchPremiumPlans = () => authRequest("/api/premium/plans");
export const subscribePremiumPlan = (token, plan) =>
  authRequest("/api/premium/subscribe", "POST", { plan }, token);
