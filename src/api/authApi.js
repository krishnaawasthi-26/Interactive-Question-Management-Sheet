const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const parseErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    if (payload?.message) return payload.message;
  } catch {
    // Ignore parse errors and use fallback below.
  }

  return "Request failed. Please try again.";
};

const request = async (path, body) => {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Please check backend/CORS setup and try again.");
  }

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
};

export const signUpUser = (payload) => request("/api/auth/signup", payload);

export const loginUser = (payload) => request("/api/auth/login", payload);
