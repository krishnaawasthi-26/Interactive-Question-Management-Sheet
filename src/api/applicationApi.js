import { authRequest } from "./authApi";

export const fetchApplicationMeta = () => authRequest("/api/applications/meta", "GET");
export const createApplicationOrder = (payload) => authRequest("/api/applications/create-order", "POST", payload);
export const verifyApplicationPayment = (payload) => authRequest("/api/applications/verify-payment", "POST", payload);
