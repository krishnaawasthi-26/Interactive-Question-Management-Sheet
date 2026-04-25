import { describe, expect, it } from "vitest";
import { buildSheetExportPayload, normalizeImportedSheet } from "../sheetTransfer";
import { buildPrintableDocument } from "../sheetExport";

describe("sheet import/export normalization", () => {
  it("supports export JSON -> import same JSON roundtrip", () => {
    const exported = buildSheetExportPayload({
      sheetTitle: "Roundtrip Sheet",
      topics: [
        {
          id: "topic-a",
          title: "Topic A",
          order: 2,
          subTopics: [
            {
              id: "sub-a",
              title: "Sub A",
              order: 1,
              questions: [{ id: "q-a", text: "Question A", done: true, notes: "n" }],
            },
          ],
        },
      ],
    });

    const imported = normalizeImportedSheet(exported);

    expect(imported.valid).toBe(true);
    expect(imported.normalized.name).toBe("Roundtrip Sheet");
    expect(imported.normalized.topics[0].subTopics[0].questions[0]).toMatchObject({
      text: "Question A",
      done: true,
      notes: "n",
    });
  });

  it("allows roundtrip import for empty sheets", () => {
    const exported = buildSheetExportPayload({
      sheetTitle: "Empty Sheet",
      topics: [],
    });

    const imported = normalizeImportedSheet(exported);

    expect(imported.valid).toBe(true);
    expect(imported.normalized.name).toBe("Empty Sheet");
    expect(imported.normalized.topics).toEqual([]);
  });

  it("imports with missing optional fields", () => {
    const imported = normalizeImportedSheet({
      name: "Missing Optional Fields",
      topics: [
        {
          title: "Topic",
          subTopics: [{ title: "Subtopic", questions: [{ text: "Q1" }] }],
        },
      ],
    });

    expect(imported.valid).toBe(true);
    expect(imported.normalized.topics[0].subTopics[0].questions[0]).toMatchObject({
      answer: "",
      link: "",
      notes: "",
      done: false,
    });
  });

  it("supports legacy key names and flattened arrays", () => {
    const imported = normalizeImportedSheet({
      title: "Legacy Sheet",
      topics: [{ id: "t1", name: "Legacy Topic", order: 2 }],
      subtopics: [{ id: "s1", topicId: "t1", name: "Legacy Subtopic" }],
      questions: [{ id: "q1", subtopicId: "s1", questionText: "Legacy Question" }],
    });

    expect(imported.valid).toBe(true);
    expect(imported.normalized.name).toBe("Legacy Sheet");
    expect(imported.normalized.topics[0].subTopics[0].questions[0].text).toBe("Legacy Question");
  });
});

describe("pdf export hierarchy and order", () => {
  it("renders strict Topic -> Subtopic -> Question hierarchy in sorted order", () => {
    const html = buildPrintableDocument({
      sheetTitle: "PDF Sheet",
      topics: [
        {
          id: "t2",
          title: "Second Topic",
          order: 2,
          subTopics: [{ id: "s2", title: "Sub B", order: 2, questions: [{ text: "Q2", order: 2 }] }],
        },
        {
          id: "t1",
          title: "First Topic",
          order: 1,
          subTopics: [
            {
              id: "s1",
              title: "Sub A",
              order: 1,
              questions: [
                { text: "Q1", order: 1 },
                { text: "Q3", order: 3 },
              ],
            },
          ],
        },
      ],
    });

    const firstTopicIndex = html.indexOf("1. First Topic");
    const secondTopicIndex = html.indexOf("2. Second Topic");
    const firstSubTopicIndex = html.indexOf("1.1 Sub A");
    const q1Index = html.indexOf("1. Q1");
    const q2Index = html.indexOf("1. Q2");

    expect(firstTopicIndex).toBeGreaterThan(-1);
    expect(secondTopicIndex).toBeGreaterThan(firstTopicIndex);
    expect(firstSubTopicIndex).toBeGreaterThan(firstTopicIndex);
    expect(q1Index).toBeGreaterThan(firstSubTopicIndex);
    expect(q2Index).toBeGreaterThan(secondTopicIndex);
  });
});
