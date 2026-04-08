const TABS = ["Questions", "Topics", "Notes", "Activity"];

function SheetTabs({ activeTab = "Questions", onChange }) {
  return (
    <div className="panel rounded-2xl p-2">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange?.(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${isActive
                ? "bg-[color-mix(in_srgb,var(--accent-primary)_20%,var(--surface-elevated))] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"}`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SheetTabs;
