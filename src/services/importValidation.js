import { normalizeImportedSheet } from "./sheetTransfer";

export const validateSheetJson = (candidate) => {
  const result = normalizeImportedSheet(candidate);

  if (!result.valid) {
    console.error("[Import] Sheet validation failed", {
      errors: result.errors,
      candidate,
    });
  }

  return result;
};
