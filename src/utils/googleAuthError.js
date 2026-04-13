const DEFAULT_GOOGLE_ERROR =
  "Google Sign-In failed. Verify that your Google Web Client ID is correct and your app origin is added in Google Cloud Console (Authorized JavaScript origins).";

export const getGoogleAuthErrorMessage = (error) => {
  const normalized = String(error?.type || error?.message || "").toLowerCase();
  if (normalized.includes("invalid_client")) {
    return "Google rejected this client ID (invalid_client). Use a Web OAuth client ID and add this frontend URL under Authorized JavaScript origins in Google Cloud Console.";
  }
  if (normalized.includes("popup_closed")) {
    return "Google login popup was closed before completion. Please try again.";
  }
  return DEFAULT_GOOGLE_ERROR;
};

