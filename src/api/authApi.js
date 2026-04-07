const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const CLIENT_RATE_LIMIT_KEY = "iqms-client-rate-limit";
const REQUEST_LIMIT = 5;
const REQUEST_WINDOW_MS = 10_000;
const REQUEST_COOLDOWN_MS = 5_000;
const isBrowser = typeof window !== "undefined";

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readRateLimitState = () => {
  if (!isBrowser) return { timestamps: [], disabledUntilEpochMs: 0 };
  return safeParse(window.localStorage.getItem(CLIENT_RATE_LIMIT_KEY), {
    timestamps: [],
    disabledUntilEpochMs: 0,
  });
};

const writeRateLimitState = (state) => {
  if (!isBrowser) return;
  window.localStorage.setItem(CLIENT_RATE_LIMIT_KEY, JSON.stringify(state));
};

const createApiError = (
  message,
  { code = null, retryAfterSeconds = null, disabledUntilEpochMs = null } = {}
) => {
  const error = new Error(message);
  error.code = code;
  error.retryAfterSeconds = retryAfterSeconds;
  error.disabledUntilEpochMs = disabledUntilEpochMs;
  return error;
};

const enforceClientSideRateLimit = () => {
  const now = Date.now();
  const state = readRateLimitState();

  if (state.disabledUntilEpochMs > now) {
    const retryAfterSeconds = Math.ceil((state.disabledUntilEpochMs - now) / 1000);
    throw createApiError(`Too many requests. Try after ${retryAfterSeconds} seconds.`, {
      code: "REQUEST_COOLDOWN",
      retryAfterSeconds,
      disabledUntilEpochMs: state.disabledUntilEpochMs,
    });
  }

  const recent = (state.timestamps ?? []).filter((timestamp) => now - timestamp <= REQUEST_WINDOW_MS);
  if (recent.length >= REQUEST_LIMIT) {
    const disabledUntilEpochMs = now + REQUEST_COOLDOWN_MS;
    writeRateLimitState({ timestamps: recent, disabledUntilEpochMs });
    throw createApiError("Too many requests. Try after 5 seconds.", {
      code: "REQUEST_COOLDOWN",
      retryAfterSeconds: 5,
      disabledUntilEpochMs,
    });
  }

  writeRateLimitState({ timestamps: [...recent, now], disabledUntilEpochMs: 0 });
};

const parseErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    if (payload?.message) {
      return {
        message: payload.message,
        code: payload.code ?? null,
        retryAfterSeconds: payload.retryAfterSeconds ?? null,
        disabledUntilEpochMs: payload.disabledUntilEpochMs ?? null,
      };
    }
  } catch {
    // Ignore JSON parse errors and try plain text fallback below.
  }

  try {
    const text = (await response.text())?.trim();
    if (text) return { message: text, code: null, retryAfterSeconds: null, disabledUntilEpochMs: null };
  } catch {
    // Ignore text parse errors and use fallback below.
  }

  return {
    message: "Request failed. Please try again.",
    code: null,
    retryAfterSeconds: null,
    disabledUntilEpochMs: null,
  };
};

export const authRequest = async (path, method = "GET", body, token) => {
  enforceClientSideRateLimit();
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw createApiError("Unable to connect right now. Please try again in a moment.");
  }

  if (!response.ok) {
    const parsed = await parseErrorMessage(response);
    throw createApiError(parsed.message, parsed);
  }

  if (response.status === 204) return null;
  return response.json();
};

export const signUpUser = (payload) => authRequest("/api/auth/signup", "POST", payload);

export const loginUser = (payload) => authRequest("/api/auth/login", "POST", payload);
