import { useEffect } from "react";
import { buildCanonicalUrl, buildImageUrl, seoDefaults } from "../config/seo";

const upsertMeta = (attribute, key, content) => {
  if (typeof document === "undefined" || !content) return;
  const selector = `meta[${attribute}="${key}"]`;
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
};

const upsertLink = (rel, href) => {
  if (typeof document === "undefined" || !href) return;
  const selector = `link[rel="${rel}"]`;
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
};

function SeoMeta({
  title,
  description,
  path = "/",
  image,
  keywords = [],
  type = "website",
  noIndex = false,
  structuredData = [],
}) {
  useEffect(() => {
    const resolvedTitle = title || seoDefaults.defaultTitle;
    const resolvedDescription = description || seoDefaults.defaultDescription;
    const canonicalUrl = buildCanonicalUrl(path);
    const imageUrl = buildImageUrl(image || seoDefaults.defaultImage);
    const mergedKeywords = [...new Set([...seoDefaults.commonKeywords, ...keywords])]
      .filter(Boolean)
      .join(", ");

    document.title = resolvedTitle;
    upsertMeta("name", "description", resolvedDescription);
    upsertMeta("name", "keywords", mergedKeywords);
    upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
    upsertLink("canonical", canonicalUrl);

    upsertMeta("property", "og:title", resolvedTitle);
    upsertMeta("property", "og:description", resolvedDescription);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:site_name", seoDefaults.siteName);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", resolvedTitle);
    upsertMeta("name", "twitter:description", resolvedDescription);
    upsertMeta("name", "twitter:image", imageUrl);

    const oldNodes = [...document.head.querySelectorAll('script[data-seo-schema="true"]')];
    oldNodes.forEach((node) => node.remove());
    const schemaList = Array.isArray(structuredData) ? structuredData.filter(Boolean) : [structuredData].filter(Boolean);
    schemaList.forEach((schema) => {
      const node = document.createElement("script");
      node.type = "application/ld+json";
      node.dataset.seoSchema = "true";
      node.text = JSON.stringify(schema);
      document.head.appendChild(node);
    });
  }, [description, image, keywords, noIndex, path, structuredData, title, type]);

  return null;
}

export default SeoMeta;

