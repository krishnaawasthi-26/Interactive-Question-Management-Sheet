import { normalizeImportedSheet } from "./sheetTransfer";

const TRAILING_COMMA_PATTERN = /,\s*([}\]])/g;

const sanitizeJsonText = (rawContent = "") => String(rawContent).replace(/^\uFEFF/, "").trim();

const parseCandidateWithCommonFixes = (rawContent) => {
  const sanitized = sanitizeJsonText(rawContent);

  try {
    return { parsed: JSON.parse(sanitized), recovered: false, syntaxError: null };
  } catch (syntaxError) {
    const withoutTrailingCommas = sanitized.replace(TRAILING_COMMA_PATTERN, "$1");

    if (withoutTrailingCommas === sanitized) {
      return { parsed: null, recovered: false, syntaxError };
    }

    try {
      return { parsed: JSON.parse(withoutTrailingCommas), recovered: true, syntaxError: null };
    } catch {
      return { parsed: null, recovered: false, syntaxError };
    }
  }
};

export const parseSheetJsonText = (rawContent) => {
  const result = parseCandidateWithCommonFixes(rawContent);

  if (!result.parsed) {
    return {
      valid: false,
      errors: ["Invalid JSON format. Fix syntax errors (for example trailing commas) and try again."],
      normalized: null,
      recoveredSyntax: false,
    };
  }

  const validation = validateSheetJson(result.parsed);
  return {
    ...validation,
    recoveredSyntax: result.recovered,
  };
};

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
