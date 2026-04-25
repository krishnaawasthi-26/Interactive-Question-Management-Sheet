import { appName } from "./envConfig";

const FALLBACK_SITE_URL = "https://createsheets.app";
const FALLBACK_IMAGE = "/vite.svg";

const normalizeSiteUrl = (value) => {
  const trimmed = `${value || ""}`.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

const resolveSiteUrl = () => {
  const configured = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
  if (configured) return configured;

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeSiteUrl(window.location.origin);
  }

  return FALLBACK_SITE_URL;
};

export const seoDefaults = {
  siteName: appName || "Create Sheets",
  siteUrl: resolveSiteUrl(),
  defaultImage: FALLBACK_IMAGE,
  defaultTitle: "Create Sheets | Create, Share & Track DSA Sheets",
  defaultDescription:
    "Create Sheets helps you create custom DSA sheets, coding practice trackers, study sheets, and interview preparation lists you can share or keep private.",
  commonKeywords: [
    "Create Sheets",
    "create sheets",
    "DSA sheets",
    "coding sheets",
    "study sheets",
    "revision sheets",
    "custom sheets",
    "problem solving sheet",
    "programming sheet",
    "data structures and algorithms sheet",
    "sheet tracker",
    "question tracker",
    "coding practice tracker",
    "competitive programming sheet",
    "LeetCode sheet",
    "GFG sheet",
    "DSA practice sheet",
    "public sheets",
    "share sheets",
    "sheet management website",
  ],
};

const withLeadingSlash = (path) => {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

export const buildCanonicalUrl = (path = "/") => {
  const normalizedPath = withLeadingSlash(path);
  return `${seoDefaults.siteUrl}${normalizedPath}`;
};

export const buildImageUrl = (imagePath = seoDefaults.defaultImage) => {
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  return `${seoDefaults.siteUrl}${withLeadingSlash(imagePath)}`;
};

