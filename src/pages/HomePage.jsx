import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { famousDsaSheets } from "../data/famousSheets";
import { navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";

function HomePage({ theme, onThemeChange }) {
  const [copyingSheetId, setCopyingSheetId] = useState(null);
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const duplicateSheet = useSheetStore((state) => state.duplicateSheet);

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  const recentSheets = [...sheets]
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 12);

  const premiumSheets = [
    {
      id: "striver-sheet",
      title: "Striver Sheet",
      description: "A2Z DSA plan with topic-wise checkpoints and progress tracking.",
      questionsSolved: 191,
      questionsTotal: 455,
      lastPracticed: "2 hours ago",
      streak: 17,
      topics: ["Arrays", "Binary Search", "DP", "Graphs"],
    },
    {
      id: "neetcode-150",
      title: "NeetCode 150",
      description: "Company-focused roadmap with blind-75 style progression.",
      questionsSolved: 89,
      questionsTotal: 150,
      lastPracticed: "Yesterday",
      streak: 8,
      topics: ["Sliding Window", "Trees", "Heap", "Backtracking"],
    },
  ];

  const copyFamousSheet = async (sheet) => {
    if (!currentUser?.token) {
      navigateTo(ROUTES.LOGIN);
      return;
    }

    setCopyingSheetId(sheet.id);
    try {
      const created = await duplicateSheet(currentUser.token, sheet, `${sheet.title} (Copy)`);
      if (created?.id) {
        navigateTo(`${ROUTES.APP}/${created.id}`);
      }
    } finally {
      setCopyingSheetId(null);
    }
  };

  return (
    <AppShell
      title="Home"
      subtitle="Browse famous sheets and quickly continue your recent work"
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Guest"}
    >
      <div className="space-y-6">
        <section className="panel rounded-xl p-4">
          <h2 className="mb-3 text-lg font-semibold">Recent Sheets</h2>
          {!currentUser?.token ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Login to see your recent sheets.
            </p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentSheets.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">No recent sheets yet.</p>
              ) : recentSheets.map((sheet) => (
                <button
                  key={sheet.id}
                  type="button"
                  className="panel-elevated min-w-72 rounded-lg px-3 py-3 text-left hover:opacity-90"
                  onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}
                >
                  <p className="font-medium">{sheet.title || "Untitled Sheet"}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Updated: {sheet.updatedAt ? new Date(sheet.updatedAt).toLocaleString() : "Unknown"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="panel rounded-xl p-4">
          <h2 className="mb-3 text-lg font-semibold">Premium Sheets</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {premiumSheets.map((sheet) => (
              <article key={sheet.id} className="panel-elevated rounded-lg p-3">
                <h3 className="font-medium text-[var(--text-primary)]">{sheet.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{sheet.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)]">
                  <p>Solved: {sheet.questionsSolved}/{sheet.questionsTotal}</p>
                  <p>Streak: {sheet.streak} days</p>
                  <p className="col-span-2">Last practiced: {sheet.lastPracticed}</p>
                  <p className="col-span-2">Focus: {sheet.topics.join(" · ")}</p>
                </div>
                <button
                  className="btn-neutral mt-3 px-3 py-1.5 text-xs"
                  type="button"
                  onClick={() => navigateTo(currentUser?.token ? ROUTES.APP : ROUTES.LOGIN)}
                >
                  {currentUser?.token ? "Continue sheet" : "Login to continue"}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel rounded-xl p-4">
          <h2 className="mb-3 text-lg font-semibold">Famous Sheets</h2>
          <div className="space-y-3">
            {famousDsaSheets.map((sheet) => (
              <article key={sheet.id} className="panel-elevated rounded-lg p-3">
                <h3 className="font-medium text-[var(--text-primary)]">{sheet.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{sheet.description}</p>
                <button
                  type="button"
                  className="btn-neutral mt-3 px-3 py-1.5 text-xs"
                  onClick={() => copyFamousSheet(sheet)}
                  disabled={copyingSheetId === sheet.id}
                >
                  {copyingSheetId === sheet.id ? "Copying..." : "Copy sample sheet"}
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default HomePage;
