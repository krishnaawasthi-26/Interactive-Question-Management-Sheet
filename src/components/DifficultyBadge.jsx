import { buildCategoryLabelAndColor } from "../services/difficultyCategories";

function DifficultyBadge({ question, difficultyCategories = [], className = "" }) {
  const difficulty = buildCategoryLabelAndColor(question, difficultyCategories);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${className}`}
      style={{
        borderColor: "color-mix(in srgb, var(--border-strong) 70%, transparent)",
        background: "color-mix(in srgb, var(--surface-elevated) 86%, transparent)",
        color: "var(--text-primary)",
      }}
    >
      <span
        className="h-2.5 w-2.5 rounded-[3px] border"
        style={{
          background: difficulty.color,
          borderColor: "color-mix(in srgb, var(--border-strong) 75%, white)",
        }}
        aria-hidden="true"
      />
      {difficulty.label}
    </span>
  );
}

export default DifficultyBadge;
