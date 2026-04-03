const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const parseErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    if (payload?.message) return payload.message;
  } catch {
    // Ignore parse errors and use fallback below.
  }

  return "Request failed. Please try again.";
};

export const authRequest = async (path, method = "GET", body, token) => {
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
    throw new Error("Unable to connect right now. Please try again in a moment.");
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (response.status === 204) return null;
  return response.json();
};

export const signUpUser = (payload) => authRequest("/api/auth/signup", "POST", payload);

export const loginUser = (payload) => authRequest("/api/auth/login", "POST", payload);
