import { useMemo } from "react";

const DEFAULT_ROWS = [
  { topic: "Segment Trees", primary: "Guide", video: "Watch", solution: "Solve", notes: "Notes", status: "In Progress" },
  { topic: "Graph BFS", primary: "Guide", video: "Watch", solution: "Solve", notes: "Notes", status: "50ks" },
  { topic: "Dynamic Programming", primary: "Guide", video: "Watch", solution: "Solve", notes: "Solved", status: "Solve!" },
];

const STATUS_STYLES = {
  "In Progress": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "50ks": "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  "Solve!": "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

function SheetDashboardView({ title, topics = [] }) {
  const flattenedRows = useMemo(() => {
    const rows = [];
    topics.forEach((topic) => {
      (topic.subTopics || []).forEach((subTopic) => {
        (subTopic.questions || []).forEach((question) => {
          rows.push({
            topic: question.text || subTopic.title || topic.title,
            primary: question.link ? "Open" : "Guide",
            video: "Watch",
            solution: question.done ? "Solved" : "Solve",
            notes: question.attempt?.notes?.trim() ? "View notes" : "Notes",
            status: question.done ? "Completed" : question.attempt ? "In Progress" : "Solve!",
          });
        });
      });
    });
    return rows.slice(0, 10);
  }, [topics]);

  const rows = flattenedRows.length ? flattenedRows : DEFAULT_ROWS;

  const summary = useMemo(() => {
    const allQuestions = topics.flatMap((topic) =>
      (topic.subTopics || []).flatMap((subTopic) => subTopic.questions || [])
    );
    const tasks = allQuestions.length || 45;
    const completed = allQuestions.filter((question) => question.done).length || 31;
    const stuck = Math.max(tasks - completed, 5);
    const successRate = tasks ? Math.round((completed / tasks) * 100) : 68;
    return {
      tasks,
      completed,
      stuck,
      avgTime: "1h 20m",
      successRate: `${successRate || 68}%`,
    };
  }, [topics]);

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {title || "Advanced DSA Sheet - V2"}
              <span className="ml-2 text-sm text-slate-400">✎</span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
            Fork Sheet
          </button>
          <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            Follow
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {[
          "Algorithms",
          "Difficulty: Hard",
          "Updated 2 days ago",
        ].map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            {tag}
          </span>
        ))}
        <button className="ml-auto rounded-lg border border-slate-200 px-2 py-1 text-slate-500 dark:border-slate-700 dark:text-slate-300">⋯</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
              <tr>
                {[
                  "Topic",
                  "Primary Link",
                  "Video",
                  "Solution",
                  "Notes",
                  "Status",
                ].map((head) => (
                  <th key={head} className="px-3 py-3 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-200">
              {rows.map((row) => (
                <tr key={`${row.topic}-${row.status}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60">
                  <td className="px-3 py-3 font-medium">{row.topic}</td>
                  <td className="px-3 py-3 text-blue-600 dark:text-blue-400">{row.primary}</td>
                  <td className="px-3 py-3 text-blue-600 dark:text-blue-400">{row.video}</td>
                  <td className="px-3 py-3 text-blue-600 dark:text-blue-400">{row.solution}</td>
                  <td className="px-3 py-3 text-blue-600 dark:text-blue-400">{row.notes}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLES[row.status] || STATUS_STYLES["In Progress"]
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Sheet Overview</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><span className="block text-xs text-slate-400">Tasks</span>{summary.tasks}</p>
              <p><span className="block text-xs text-slate-400">Completed</span>{summary.completed}</p>
              <p><span className="block text-xs text-slate-400">Stuck</span>{summary.stuck}</p>
              <p><span className="block text-xs text-slate-400">Avg Time</span>{summary.avgTime}</p>
              <p className="col-span-2"><span className="block text-xs text-slate-400">Success Rate</span>{summary.successRate}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Popular Resources</h3>
            <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
              {["Segment Trees Explained", "BFS in Depth", "DP Tips & Tricks"].map((resource) => (
                <li key={resource}>
                  <a href="#" className="hover:underline">{resource}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SheetDashboardView;
