import { buildSheetExportPayload, normalizeTopicsForExport } from "./sheetTransfer";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const sanitizeUrl = (value = "") => {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return "";
  }

  return "";
};

const buildQuestionMarkup = (question, questionIndex) => {
  const safeQuestionText = escapeHtml(question.text || "");
  const safeLink = sanitizeUrl(question.link);
  const questionLabel = `${questionIndex + 1}. ${safeQuestionText || "Untitled question"}`;

  if (!safeLink) {
    return `<li>${questionLabel}</li>`;
  }

  return `<li>${questionLabel} <a href="${escapeHtml(safeLink)}" target="_blank" rel="noopener noreferrer">(Open link)</a></li>`;
};

export const buildPrintableDocument = ({ sheetTitle, topics }) => {
  const safeSheetTitle = escapeHtml(sheetTitle || "Question Sheet");
  const orderedTopics = normalizeTopicsForExport(topics);

  const content = orderedTopics
    .map(
      (topic, topicIndex) => `
        <section class="topic-section">
          <h2>${topicIndex + 1}. ${escapeHtml(topic.title || "Untitled topic")}</h2>
          ${(topic.subTopics || [])
            .map(
              (subTopic, subTopicIndex) => `
                <section class="subtopic-section">
                  <h3>${topicIndex + 1}.${subTopicIndex + 1} ${escapeHtml(subTopic.title || "Untitled subtopic")}</h3>
                  <ol>
                    ${(subTopic.questions || [])
                      .map((question, questionIndex) => buildQuestionMarkup(question, questionIndex))
                      .join("")}
                  </ol>
                </section>
              `
            )
            .join("")}
        </section>
      `
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${safeSheetTitle}</title>
        <style>
          @page { margin: 16mm; }
          body { font-family: Arial, sans-serif; padding: 0; color: #111; line-height: 1.45; }
          h1 { margin-bottom: 24px; font-size: 28px; }
          .topic-section { margin-top: 20px; break-inside: avoid-page; }
          .subtopic-section { margin-top: 10px; margin-left: 16px; break-inside: avoid-page; }
          h2 { margin: 0 0 8px 0; font-size: 20px; font-weight: 700; page-break-after: avoid; }
          h3 { margin: 0 0 6px 0; font-size: 16px; font-weight: 600; page-break-after: avoid; }
          ol { margin-top: 8px; padding-left: 20px; }
          li { margin-bottom: 6px; }
          a { color: #1d4ed8; text-decoration: underline; word-break: break-word; }
        </style>
      </head>
      <body>
        <h1>${safeSheetTitle}</h1>
        ${content || "<p>No topics found.</p>"}
      </body>
    </html>
  `;
};

const triggerPrint = async (printWindow) => {
  const readyStatePromise = new Promise((resolve) => {
    if (printWindow.document.readyState === "complete") {
      resolve();
      return;
    }

    printWindow.addEventListener("load", resolve, { once: true });
    setTimeout(resolve, 300);
  });

  await readyStatePromise;

  if (printWindow.document.fonts?.ready) {
    try {
      await printWindow.document.fonts.ready;
    } catch {
      // Ignore font readiness errors and still attempt to print.
    }
  }

  printWindow.focus();
  printWindow.print();
};

export const exportSheetAsJson = ({ sheetTitle, topics }) => {
  const payload = buildSheetExportPayload({ sheetTitle, topics });
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${sheetTitle.toLowerCase().replace(/\s+/g, "-") || "question-sheet"}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const exportSheetAsPdf = ({ sheetTitle, topics }) => {
  const printableDocument = buildPrintableDocument({ sheetTitle, topics });
  const printWindow = window.open("", "_blank");

  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printableDocument);
    printWindow.document.close();

    triggerPrint(printWindow);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }

    triggerPrint(frameWindow);
    frameWindow.onafterprint = cleanup;
    setTimeout(cleanup, 1500);
  };

  document.body.appendChild(iframe);
  iframe.srcdoc = printableDocument;
};
