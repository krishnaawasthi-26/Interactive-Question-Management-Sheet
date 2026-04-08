import { useSheetStore } from "../sheetStore";
import { createTopic } from "../../api/questionSheet";
import { getSheet, saveSheet } from "../../api/sheetApi";

vi.mock("../../api/questionSheet", () => ({
  createTopic: vi.fn(),
  createSubTopic: vi.fn(),
  createQuestion: vi.fn(),
  updateTopic: vi.fn(),
  deleteTopic: vi.fn(),
  updateSubTopic: vi.fn(),
  deleteSubTopic: vi.fn(),
  updateQuestion: vi.fn(),
  deleteQuestion: vi.fn(),
}));

vi.mock("../../api/sheetApi", () => ({
  createSheet: vi.fn(),
  getSheet: vi.fn(),
  listSheets: vi.fn(),
  removeSheet: vi.fn(),
  saveSheet: vi.fn(),
}));

const baseTopics = [
  {
    id: "t1",
    title: "Topic",
    subTopics: [
      {
        id: "s1",
        title: "Sub",
        questions: [{ id: "q1", text: "Q1", done: false }],
      },
    ],
  },
];

const resetStore = () => {
  useSheetStore.setState({
    sheets: [],
    activeSheetId: "sheet-1",
    topics: JSON.parse(JSON.stringify(baseTopics)),
    sheetTitle: "Sheet A",
    isLoading: false,
    loadError: null,
    loadSource: "idle",
    past: [],
    future: [],
    limitWarning: null,
    hasPendingChanges: false,
    isSaving: false,
    saveError: null,
    lastSavedAt: null,
  });
};

describe("sheetStore core flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("supports CRUD updates with undo/redo history", async () => {
    createTopic.mockResolvedValue({
      topics: [
        ...baseTopics,
        {
          id: "t2",
          title: "New Topic",
          subTopics: [],
        },
      ],
    });

    await useSheetStore.getState().addTopic("New Topic");
    expect(useSheetStore.getState().topics).toHaveLength(2);

    useSheetStore.getState().undo();
    expect(useSheetStore.getState().topics).toHaveLength(1);

    useSheetStore.getState().redo();
    expect(useSheetStore.getState().topics).toHaveLength(2);
    expect(useSheetStore.getState().hasPendingChanges).toBe(true);
  });

  it("saves draft and can discard pending changes", async () => {
    getSheet.mockResolvedValue({
      id: "sheet-1",
      title: "Sheet A",
      topics: baseTopics,
      updatedAt: "2026-04-08T00:00:00Z",
    });
    saveSheet.mockResolvedValue({ id: "sheet-1" });

    await useSheetStore.getState().loadSheetById("token", "sheet-1");
    useSheetStore.getState().setSheetTitle("Sheet A updated");

    expect(useSheetStore.getState().hasPendingChanges).toBe(true);

    const saved = await useSheetStore.getState().saveCurrentSheetDraft("token");
    expect(saved).toBe(true);
    expect(useSheetStore.getState().hasPendingChanges).toBe(false);

    useSheetStore.getState().setSheetTitle("Unsaved change");
    expect(useSheetStore.getState().sheetTitle).toBe("Unsaved change");

    useSheetStore.getState().discardUnsavedChanges();
    expect(useSheetStore.getState().sheetTitle).toBe("Sheet A updated");
    expect(useSheetStore.getState().hasPendingChanges).toBe(false);
  });

  it("surfaces save failures and keeps pending changes", async () => {
    getSheet.mockResolvedValue({
      id: "sheet-1",
      title: "Sheet A",
      topics: baseTopics,
      updatedAt: "2026-04-08T00:00:00Z",
    });
    saveSheet.mockRejectedValue(new Error("disk full"));

    await useSheetStore.getState().loadSheetById("token", "sheet-1");
    useSheetStore.getState().setSheetTitle("Need save");

    const saved = await useSheetStore.getState().saveCurrentSheetDraft("token");

    expect(saved).toBe(false);
    expect(useSheetStore.getState().saveError).toBe("disk full");
    expect(useSheetStore.getState().hasPendingChanges).toBe(true);
  });
});
