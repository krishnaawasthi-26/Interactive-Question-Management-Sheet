const buildExportPayload = ({ sheetTitle, topics }) => ({
  id: `sheet_${Date.now()}`,
  name: sheetTitle,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  topics,
});

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildPrintableDocument = ({ sheetTitle, topics }) => {
  const safeSheetTitle = escapeHtml(sheetTitle || "Question Sheet");
  const content = topics
    .map(
      (topic) => `
        <section>
          <h2>${escapeHtml(topic.title || "Untitled topic")}</h2>
          ${(topic.subTopics || [])
            .map(
              (subTopic) => `
                <h3>${escapeHtml(subTopic.title || "Untitled subtopic")}</h3>
                <ol>
                  ${(subTopic.questions || [])
                    .map((question) => `<li>${escapeHtml(question.text || "")}</li>`)
                    .join("")}
                </ol>
              `
            )
            .join("")}
        </section>
      `
    )
    .join("");

  return `
    <html>
      <head>
        <title>${safeSheetTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { margin-bottom: 24px; }
          h2 { margin-top: 20px; margin-bottom: 8px; }
          h3 { margin-top: 12px; margin-bottom: 6px; font-size: 16px; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <h1>${safeSheetTitle}</h1>
        ${content || "<p>No topics found.</p>"}
      </body>
    </html>
  `;
};

export const exportSheetAsJson = ({ sheetTitle, topics }) => {
  const payload = buildExportPayload({ sheetTitle, topics });
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
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (printWindow) {
    printWindow.document.write(printableDocument);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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

    frameWindow.focus();
    frameWindow.print();
    frameWindow.onafterprint = cleanup;
    setTimeout(cleanup, 1000);
  };

  document.body.appendChild(iframe);
  iframe.srcdoc = printableDocument;
};
