const buildExportPayload = ({ sheetTitle, topics }) => ({
  id: `sheet_${Date.now()}`,
  name: sheetTitle,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  topics,
});

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
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) return;

  const content = topics
    .map(
      (topic) => `
        <section>
          <h2>${topic.title}</h2>
          ${(topic.subTopics || [])
            .map(
              (subTopic) => `
                <h3>${subTopic.title}</h3>
                <ol>
                  ${(subTopic.questions || [])
                    .map((question) => `<li>${question.text}</li>`)
                    .join("")}
                </ol>
              `
            )
            .join("")}
        </section>
      `
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>${sheetTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { margin-bottom: 24px; }
          h2 { margin-top: 20px; margin-bottom: 8px; }
          h3 { margin-top: 12px; margin-bottom: 6px; font-size: 16px; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <h1>${sheetTitle}</h1>
        ${content || "<p>No topics found.</p>"}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
