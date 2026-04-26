import { useMemo, useState } from "react";
import { buildDistribution } from "../services/difficultyCategories";
import DonutChart from "./DonutChart";

function DifficultyDistributionWidget({ topics = [], categories = [], showCompleted = false }) {
  const [expanded, setExpanded] = useState(false);
  const distribution = useMemo(() => buildDistribution(topics, categories), [topics, categories]);
  const visibleRows = expanded ? distribution.categories : distribution.categories.slice(0, 5);

  return (
    <section className="panel-elevated mb-4 rounded-xl p-3 sm:p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <DonutChart items={distribution.categories} total={distribution.total} />
        <div className="max-h-56 flex-1 space-y-2 overflow-auto pr-1">
          {visibleRows.map((entry) => (
            <div key={entry.key} className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--surface)]/70 px-3 py-2">
              <div>
                <p className="text-sm font-medium" style={{ color: entry.color }}>{entry.label}</p>
                {showCompleted ? <p className="text-xs text-[var(--text-secondary)]">{entry.completed}/{entry.count} completed</p> : null}
              </div>
              <p className="text-sm text-[var(--text-primary)]">{entry.count} <span className="text-xs text-[var(--text-secondary)]">({entry.percent}%)</span></p>
            </div>
          ))}
          {distribution.categories.length > 5 && (
            <button type="button" className="btn-base btn-neutral px-3 py-1 text-xs" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Show less" : "View all"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default DifficultyDistributionWidget;
