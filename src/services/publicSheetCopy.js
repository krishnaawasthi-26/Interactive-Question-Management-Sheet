export const DEFAULT_COPY_ERROR_MESSAGE = "Could not copy this sheet right now. Please try again.";

const asTrimmedString = (value) => (typeof value === "string" ? value.trim() : "");

export const buildRemixCopyTitle = ({
  sharedSheetTitle,
  remixTitle,
  keepAttribution = false,
  ownerUsername,
}) => {
  const baseTitle = asTrimmedString(remixTitle) || `${asTrimmedString(sharedSheetTitle) || "Untitled Sheet"} (Copy)`;
  const attributionUsername = asTrimmedString(ownerUsername);

  if (!keepAttribution || !attributionUsername) {
    return baseTitle;
  }

  return `${baseTitle} (Remix of @${attributionUsername})`;
};

export const resolveCopySourceSheetId = async ({ sourceSheetId, sourceShareId, currentSharedSheetId, getSharedSheet }) => {
  if (sourceSheetId) return sourceSheetId;
  if (currentSharedSheetId) return currentSharedSheetId;
  if (!sourceShareId) return null;

  const resolvedSharedSheet = await getSharedSheet(sourceShareId);
  return resolvedSharedSheet?.id || null;
};

export const toCopyErrorMessage = (error) => {
  if (!error) return DEFAULT_COPY_ERROR_MESSAGE;

  const status = Number(error.status);
  const message = asTrimmedString(error.message);

  if (status === 401 || status === 403) {
    return "Your session expired. Please log in again to copy this sheet.";
  }

  if (status === 404) {
    return "The source sheet could not be found. Ask the creator to re-share the sheet.";
  }

  if (status === 409) {
    return message || "You already copied this sheet. Open My Sheets to continue.";
  }

  if (status === 429) {
    return "Too many copy requests. Please wait a moment and try again.";
  }

  if (message) {
    return message;
  }

  return DEFAULT_COPY_ERROR_MESSAGE;
};
