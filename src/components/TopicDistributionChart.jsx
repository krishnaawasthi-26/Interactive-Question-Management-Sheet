import { useMemo, useState } from "react";
import DonutChart from "./DonutChart";

function TopicDistributionChart({ topics = [], topicTags = [] }) {
  const [expanded, setExpanded] = useState(false);
  const distribution = useMemo(() => {
    const counts = new Map(topicTags.map((tag) => [tag.id, 0]));
    topics.forEach((topic) => {
      (topic.subTopics || []).forEach((sub) => {
        (sub.questions || []).forEach((question) => {
          [...new Set(question.topicTagIds || [])].forEach((id) => counts.set(id, (counts.get(id) || 0) + 1));
        });
      });
    });
    const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
    const items = topicTags
      .map((tag) => ({ key: tag.id, label: tag.name, color: tag.color, count: counts.get(tag.id) || 0 }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .map((item) => ({ ...item, percent: total ? Math.round((item.count / total) * 100) : 0 }));
    return { total, items };
  }, [topicTags, topics]);

  const rows = expanded ? distribution.items : distribution.items.slice(0, 6);

  return (
    <section className="panel-elevated mb-4 rounded-xl p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Topic/Tag Distribution</h3>
        <span className="text-xs text-[var(--text-secondary)]">Question-tag links: {distribution.total}</span>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <DonutChart items={distribution.items} total={distribution.total} />
        <div className="max-h-56 flex-1 space-y-2 overflow-auto pr-1">
          {rows.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">No questions/tags yet. Add your first question to see distribution.</p> : rows.map((entry) => (
            <div key={entry.key} className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--surface)]/70 px-3 py-2">
              <p className="text-sm font-medium" style={{ color: entry.color }}>{entry.label}</p>
              <p className="text-sm text-[var(--text-primary)]">{entry.count} <span className="text-xs text-[var(--text-secondary)]">({entry.percent}%)</span></p>
            </div>
          ))}
          {distribution.items.length > 6 ? <button type="button" className="btn-base btn-neutral px-3 py-1 text-xs" onClick={() => setExpanded((v) => !v)}>{expanded ? "Show less" : "Show all tags"}</button> : null}
        </div>
      </div>
    </section>
  );
}

export default TopicDistributionChart;
