const DEFAULT_GOOGLE_ERROR =
  "Google Sign-In failed. Verify that your Google Web Client ID is correct and your app origin is added in Google Cloud Console (Authorized JavaScript origins).";

export const getGoogleAuthErrorMessage = (error) => {
  const normalized = String(error?.type || error?.message || "").toLowerCase();
  if (normalized.includes("invalid_client")) {
    return "Google rejected this client ID (invalid_client). Use a Web OAuth client ID and add this frontend URL under Authorized JavaScript origins in Google Cloud Console.";
  }
  if (normalized.includes("idpiframe_initialization_failed") || normalized.includes("origin")) {
    return "Google iframe initialization failed (often origin_mismatch). Add this exact frontend origin to Authorized JavaScript origins in Google Cloud Console.";
  }
  if (normalized.includes("token audience mismatch") || normalized.includes("audience mismatch")) {
    return "Google token audience mismatch. The frontend client ID and backend APP_AUTH_GOOGLE_CLIENT_ID/APP_AUTH_GOOGLE_CLIENT_IDS must match.";
  }
  if (normalized.includes("invalid google token")) {
    return "Google did not accept the ID token. This can happen if token verification is blocked or the token is expired.";
  }
  if (normalized.includes("popup_closed")) {
    return "Google login popup was closed before completion. Please try again.";
  }
  return DEFAULT_GOOGLE_ERROR;
};
