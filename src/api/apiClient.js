import {
  API_BASE_URL,
  API_ERROR_MESSAGES,
  API_REQUEST_TIMEOUT_MS,
  CLIENT_RATE_LIMIT,
} from "../config/apiConfig";

const isBrowser = typeof window !== "undefined";
const GET_CACHE_TTL_MS = 10_000;
const inMemoryGetCache = new Map();

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeRateLimitState = (rawState) => {
  const state = rawState && typeof rawState === "object" ? rawState : {};
  const timestamps = Array.isArray(state.timestamps)
    ? state.timestamps.filter((timestamp) => Number.isFinite(timestamp))
    : [];

  return {
    timestamps,
    disabledUntilEpochMs: Number.isFinite(state.disabledUntilEpochMs)
      ? state.disabledUntilEpochMs
      : 0,
  };
};

const readRateLimitState = () => {
  if (!isBrowser) return { timestamps: [], disabledUntilEpochMs: 0 };

  const parsed = safeParse(window.localStorage.getItem(CLIENT_RATE_LIMIT.storageKey), {
    timestamps: [],
    disabledUntilEpochMs: 0,
  });

  return normalizeRateLimitState(parsed);
};

const writeRateLimitState = (state) => {
  if (!isBrowser) return;
  window.localStorage.setItem(CLIENT_RATE_LIMIT.storageKey, JSON.stringify(state));
};

export const createApiError = (
  message,
  {
    code = null,
    status = null,
    retryAfterSeconds = null,
    disabledUntilEpochMs = null,
    details = null,
  } = {}
) => {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.retryAfterSeconds = retryAfterSeconds;
  error.disabledUntilEpochMs = disabledUntilEpochMs;
  error.details = details;
  return error;
};

const parseErrorPayload = async (response) => {
  const contentType = response.headers.get("content-type") ?? "";
  const jsonResponse = typeof response.clone === "function" ? response.clone() : response;

  try {
    if (contentType.includes("application/json")) {
      const payload = await jsonResponse.json();
      if (payload?.message || payload?.error) {
        return {
          message: payload.message ?? payload.error,
          code: payload.code ?? null,
          retryAfterSeconds: payload.retryAfterSeconds ?? null,
          disabledUntilEpochMs: payload.disabledUntilEpochMs ?? null,
          details: payload,
        };
      }
    }
  } catch {
    // Ignore JSON parse errors and try plain text fallback below.
  }

  try {
    const text = (await response.text())?.trim();
    if (text) {
      return {
        message: text,
        code: null,
        retryAfterSeconds: null,
        disabledUntilEpochMs: null,
        details: null,
      };
    }
  } catch {
    // Ignore read errors and use fallback below.
  }

  return {
    message: API_ERROR_MESSAGES.requestFailed,
    code: null,
    retryAfterSeconds: null,
    disabledUntilEpochMs: null,
    details: null,
  };
};

const maybeEnforceRateLimit = ({ rateLimit = false } = {}) => {
  if (!rateLimit) return;
  if (!Number.isFinite(CLIENT_RATE_LIMIT.requestLimit) || CLIENT_RATE_LIMIT.requestLimit <= 0) return;

  const now = Date.now();
  const state = readRateLimitState();

  if (state.disabledUntilEpochMs > now) {
    const retryAfterSeconds = Math.ceil((state.disabledUntilEpochMs - now) / 1000);
    throw createApiError(API_ERROR_MESSAGES.rateLimited.replace("{seconds}", retryAfterSeconds), {
      code: "REQUEST_COOLDOWN",
      retryAfterSeconds,
      disabledUntilEpochMs: state.disabledUntilEpochMs,
    });
  }

  const recent = (state.timestamps ?? []).filter(
    (timestamp) => now - timestamp <= CLIENT_RATE_LIMIT.requestWindowMs
  );

  if (recent.length >= CLIENT_RATE_LIMIT.requestLimit) {
    const disabledUntilEpochMs = now + CLIENT_RATE_LIMIT.cooldownMs;
    const retryAfterSeconds = Math.ceil(CLIENT_RATE_LIMIT.cooldownMs / 1000);

    writeRateLimitState({ timestamps: recent, disabledUntilEpochMs });

    throw createApiError(API_ERROR_MESSAGES.rateLimited.replace("{seconds}", retryAfterSeconds), {
      code: "REQUEST_COOLDOWN",
      retryAfterSeconds,
      disabledUntilEpochMs,
    });
  }

  writeRateLimitState({ timestamps: [...recent, now], disabledUntilEpochMs: 0 });
};

const trimTrailingSlashes = (value) => value.replace(/\/+$/, "");
const buildGetCacheKey = ({ method, requestUrl, token, headers }) =>
  JSON.stringify({
    method,
    requestUrl,
    token: token ? "auth" : "public",
    headers: Object.entries(headers || {}).sort(([a], [b]) => a.localeCompare(b)),
  });

const toRequestUrl = ({ path, baseUrl }) => {
  if (/^https?:\/\//i.test(path)) return path;
  if (!baseUrl) return path;

  const normalizedBaseUrl = trimTrailingSlashes(baseUrl);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (/\/api$/i.test(normalizedBaseUrl) && /^\/api(\/|$)/i.test(normalizedPath)) {
    const pathWithoutApiPrefix = normalizedPath.replace(/^\/api/i, "") || "/";
    return `${normalizedBaseUrl}${pathWithoutApiPrefix}`;
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
};

const parseResponseData = async (response) => {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const raw = await response.text();
    if (!raw) return null;
    return JSON.parse(raw);
  }

  const text = await response.text();
  return text || null;
};

export const apiRequest = async (
  path,
  { method = "GET", body, token, headers = {}, baseUrl = API_BASE_URL, rateLimit = false } = {}
) => {
  maybeEnforceRateLimit({ rateLimit });
  const normalizedMethod = `${method || "GET"}`.toUpperCase();
  const requestUrl = toRequestUrl({ path, baseUrl });
  const shouldUseGetCache = normalizedMethod === "GET" && !body;
  if (!shouldUseGetCache && inMemoryGetCache.size > 0) {
    inMemoryGetCache.clear();
  }

  if (shouldUseGetCache) {
    const cacheKey = buildGetCacheKey({ method: normalizedMethod, requestUrl, token, headers });
    const cachedValue = inMemoryGetCache.get(cacheKey);
    if (cachedValue && cachedValue.expiresAt > Date.now()) {
      return cachedValue.promise;
    }
  }

  const performRequest = async () => {
    let response;
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => {
      controller.abort();
    }, API_REQUEST_TIMEOUT_MS);

    try {
      response = await fetch(requestUrl, {
        method: normalizedMethod,
        signal: controller.signal,
        headers: {
          ...(body !== undefined && body !== null ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        ...(body !== undefined && body !== null ? { body: JSON.stringify(body) } : {}),
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw createApiError(API_ERROR_MESSAGES.timeout, { code: "REQUEST_TIMEOUT" });
      }
      throw createApiError(API_ERROR_MESSAGES.network);
    } finally {
      globalThis.clearTimeout(timeout);
    }

    if (!response.ok) {
      const parsed = await parseErrorPayload(response);
      throw createApiError(parsed.message, {
        ...parsed,
        status: response.status,
      });
    }

    return parseResponseData(response);
  };

  if (!shouldUseGetCache) {
    return performRequest();
  }

  const cacheKey = buildGetCacheKey({ method: normalizedMethod, requestUrl, token, headers });
  const pendingPromise = performRequest().catch((error) => {
    inMemoryGetCache.delete(cacheKey);
    throw error;
  });
  inMemoryGetCache.set(cacheKey, { promise: pendingPromise, expiresAt: Date.now() + GET_CACHE_TTL_MS });
  return pendingPromise;
};
