import { useMemo, useState } from "react";
import SheetHeader from "./SheetHeader";
import SheetTabs from "./SheetTabs";
import QuestionsTable from "./QuestionsTable";
import OverviewRail from "./OverviewRail";

function getSheetRows(topics) {
  const rows = [];
  topics.forEach((topic) => {
    (topic.subTopics || []).forEach((subTopic) => {
      (subTopic.questions || []).forEach((question, index) => {
        const resourceLink = question.link || question.url || question.resourceUrl || "";
        rows.push({
          id: `${topic.id || topic.title}-${subTopic.id || subTopic.title}-${question.id || index}`,
          topic: topic.title || "General",
          question: question.text || subTopic.title || "Untitled question",
          primary: resourceLink,
          notes: question.attempt?.notes?.trim() || "",
          status: question.done ? "Completed" : question.attempt ? "In Progress" : "Solve!",
        });
      });
    });
  });
  return rows;
}

function formatRelativeDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function SheetDashboardView({ title, topics = [], updatedAt, onOpenEdit }) {
  const [activeTab, setActiveTab] = useState("Questions");
  const rows = useMemo(() => getSheetRows(topics), [topics]);

  const summary = useMemo(() => {
    const tasks = rows.length;
    const completed = rows.filter((question) => question.status === "Completed").length;
    const pending = Math.max(tasks - completed, 0);
    const successRate = tasks ? `${Math.round((completed / tasks) * 100)}%` : "0%";
    return { tasks, completed, pending, successRate };
  }, [rows]);

  return (
    <div className="space-y-5">
      <SheetHeader
        title={title}
        description="Curated interview preparation sheet optimized for readability and progress tracking."
        topicsCount={topics.length}
        questionCount={rows.length}
        updatedAt={formatRelativeDate(updatedAt)}
        onOpenEdit={onOpenEdit}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        <div className="space-y-4">
          <SheetTabs activeTab={activeTab} onChange={setActiveTab} />
          {activeTab === "Questions" ? (
            <QuestionsTable rows={rows} />
          ) : (
            <section className="panel rounded-2xl px-4 py-8 text-sm text-[var(--text-secondary)]">
              {activeTab} content is available in the full sheet workspace.
            </section>
          )}
        </div>

        <OverviewRail summary={summary} topicsCount={topics.length} updatedAt={formatRelativeDate(updatedAt)} />
      </div>
    </div>
  );
}

export default SheetDashboardView;
