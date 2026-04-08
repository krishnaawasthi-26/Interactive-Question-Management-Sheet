import SiteNav from "../components/SiteNav";

const weakAreas = ["Sliding Window", "Graph BFS", "Dynamic Programming"];

const dependencyAlerts = [
  "Sliding Window",
  "Graph BFS",
  "Dynamic Programming",
  "Review Needed",
];

const graphNodes = [
  { id: "binary-search-basics", label: "Binary Search Basics", x: "12%", y: "28%" },
  { id: "binary-search-answer", label: "Binary Search on Answer", x: "43%", y: "18%" },
  { id: "backtracking", label: "Backtracking Techniques", x: "22%", y: "58%" },
  { id: "advanced-recursion", label: "Advanced Recursion (DP)", x: "58%", y: "60%" },
];

function LearningInsightsPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <SiteNav />

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Learning Insights</h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Private dashboard · visible only to your account
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Learning Insights</h2>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Weak Areas</p>
                <ul className="mt-3 space-y-2">
                  {weakAreas.map((topic) => (
                    <li key={topic} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Dependency Graph</h2>
                <ul className="mt-3 space-y-2">
                  {dependencyAlerts.map((topic) => (
                    <li key={topic} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {topic}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">6 items due for revision</p>
              </section>
            </aside>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Concept dependency map</h2>
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
                  <path d="M 170 170 C 300 60, 350 70, 430 120" fill="none" stroke="#1d4ed8" strokeWidth="3" markerEnd="url(#arrow)" />
                  <path d="M 170 180 C 260 260, 280 310, 360 360" fill="none" stroke="#1d4ed8" strokeWidth="3" markerEnd="url(#arrow)" />
                  <path d="M 490 130 C 620 130, 650 250, 640 320" fill="none" stroke="#1d4ed8" strokeWidth="3" markerEnd="url(#arrow)" />
                  <path d="M 410 360 C 480 420, 560 400, 620 350" fill="none" stroke="#1d4ed8" strokeWidth="3" markerEnd="url(#arrow)" />
                </svg>

                {graphNodes.map((node) => (
                  <div
                    key={node.id}
                    className="absolute min-w-[170px] rounded-xl border border-blue-900 bg-blue-950 px-3 py-2 text-center text-xs font-medium text-blue-50 shadow-lg sm:text-sm"
                    style={{ left: node.x, top: node.y }}
                  >
                    {node.label}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningInsightsPage;
