import { useEffect, useMemo } from "react";
import SiteNav from "../components/SiteNav";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";

const NODE_WIDTH = 170;
const NODE_HEIGHT = 44;

const createGraphLayout = (nodes) => {
  if (!nodes.length) return [];
  const columns = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(nodes.length))));
  const rows = Math.ceil(nodes.length / columns);
  return nodes.map((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = 12 + column * (76 / Math.max(columns - 1, 1));
    const y = 12 + row * (72 / Math.max(rows - 1, 1));
    return { ...node, x: `${Math.min(x, 86)}%`, y: `${Math.min(y, 84)}%`, column, row };
  });
};

const parseMinutes = (timeLabel) => {
  if (!timeLabel || typeof timeLabel !== "string") return 0;
  const match = timeLabel.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
};

function LearningInsightsPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
  }, [currentUser?.token, loadSheets]);

  const insights = useMemo(() => {
    const topicStats = new Map();
    const revisionMap = new Map();
    let solvedCount = 0;
    let totalQuestions = 0;
    let totalMinutesSpent = 0;

    sheets.forEach((sheet) => {
      (sheet.topics || []).forEach((topic) => {
        const topicTitle = (topic?.title || "Untitled Topic").trim();
        const current = topicStats.get(topicTitle) || {
          topic: topicTitle,
          solved: 0,
          total: 0,
          failed: 0,
          attempts: 0,
          subTopics: new Set(),
        };

        (topic.subTopics || []).forEach((subTopic) => {
          current.subTopics.add((subTopic?.title || "Untitled Subtopic").trim());

          (subTopic.questions || []).forEach((question) => {
            totalQuestions += 1;
            current.total += 1;

            if (question?.done) {
              solvedCount += 1;
              current.solved += 1;
            }

            if (question?.attemptLog) {
              current.attempts += 1;
              totalMinutesSpent += parseMinutes(question.attemptLog.timeSpent);
              if (question.attemptLog.result === "failed") {
                current.failed += 1;
              }
              const revisionLabel = question.attemptLog.revision || "No revision date";
              revisionMap.set(revisionLabel, (revisionMap.get(revisionLabel) || 0) + 1);
            }
          });
        });

        topicStats.set(topicTitle, current);
      });
    });

    const allTopics = Array.from(topicStats.values()).map((entry) => ({
      ...entry,
      completionRate: entry.total ? Math.round((entry.solved / entry.total) * 100) : 0,
      subTopics: Array.from(entry.subTopics),
    }));

    const weakAreas = allTopics
      .filter((topic) => topic.total > 0)
      .sort((a, b) => a.completionRate - b.completionRate || b.total - a.total)
      .slice(0, 5);

    const dependencyAlerts = Array.from(revisionMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([revision, count]) => ({ revision, count }));

    const graphNodes = createGraphLayout(
      allTopics.slice(0, 9).map((topic) => ({
        id: topic.topic.toLowerCase().replace(/\s+/g, "-"),
        label: topic.topic,
      }))
    );

    return {
      weakAreas,
      dependencyAlerts,
      graphNodes,
      solvedCount,
      totalQuestions,
      totalMinutesSpent,
      attemptCount: allTopics.reduce((sum, topic) => sum + topic.attempts, 0),
    };
  }, [sheets]);

  return (
    <div className="app-shell text-[var(--text-primary)]">
      <div className="app-content space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <SiteNav />

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Learning Insights</h1>
            <p className="text-xs text-slate-500 sm:text-sm">Private dashboard · based on your own sheets</p>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">Solved Questions</p>
              <p className="text-lg font-semibold text-slate-900">{insights.solvedCount}/{insights.totalQuestions}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">Attempts Logged</p>
              <p className="text-lg font-semibold text-slate-900">{insights.attemptCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">Practice Time</p>
              <p className="text-lg font-semibold text-slate-900">{insights.totalMinutesSpent} min</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Weak Areas</h2>
                {insights.weakAreas.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Add and solve questions in your sheets to generate weak areas.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {insights.weakAreas.map((topic) => (
                      <li key={topic.topic} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <div className="flex items-center justify-between gap-2">
                          <span>{topic.topic}</span>
                          <span className="text-xs text-slate-500">{topic.completionRate}%</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Revision Alerts</h2>
                {insights.dependencyAlerts.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">Save attempt logs to see upcoming revision buckets.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {insights.dependencyAlerts.map((item) => (
                      <li key={item.revision} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <div className="flex items-center justify-between gap-2">
                          <span>{item.revision}</span>
                          <span className="text-xs text-slate-500">{item.count} items</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </aside>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Concept map (from your topics)</h2>
              {insights.graphNodes.length === 0 ? (
                <p className="text-sm text-slate-500">Create topics in any sheet to build your concept map.</p>
              ) : (
                <div className="relative min-h-[440px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <svg
                    viewBox="0 0 1000 500"
                    className="absolute inset-0 h-full w-full"
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    aria-label="Topic dependency graph"
                  >
                    <defs>
                      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1d4ed8" />
                      </marker>
                    </defs>
                    {insights.graphNodes.slice(1).map((node, index) => {
                      const previous = insights.graphNodes[index];
                      const x1 = previous.column * 280 + 150;
                      const y1 = previous.row * 170 + 90;
                      const x2 = node.column * 280 + 150;
                      const y2 = node.row * 170 + 90;
                      return (
                        <path
                          key={`${previous.id}-${node.id}`}
                          d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1 - 40}, ${(x1 + x2) / 2} ${y2 + 40}, ${x2} ${y2}`}
                          fill="none"
                          stroke="#1d4ed8"
                          strokeWidth="2"
                          markerEnd="url(#arrow)"
                        />
                      );
                    })}
                  </svg>

                  {insights.graphNodes.map((node) => (
                    <div
                      key={node.id}
                      className="absolute rounded-xl border border-blue-900 bg-blue-950 px-3 py-2 text-center text-xs font-medium text-blue-50 shadow-lg sm:text-sm"
                      style={{ left: node.x, top: node.y, width: `${NODE_WIDTH}px`, minHeight: `${NODE_HEIGHT}px` }}
                    >
                      {node.label}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningInsightsPage;
