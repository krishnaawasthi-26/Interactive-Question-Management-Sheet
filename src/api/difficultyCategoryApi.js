import { authRequest } from "./authApi";

export const listDifficultyCategories = (token) => authRequest("/api/difficulty-categories", "GET", null, token);
export const createDifficultyCategory = (token, payload) => authRequest("/api/difficulty-categories", "POST", payload, token);
