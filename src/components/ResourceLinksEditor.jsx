const RESOURCE_TYPES = ["Solution", "Video", "Article", "Notes", "GitHub", "Discussion", "Other"];

const emptyLink = () => ({
  id: `resource-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  url: "",
  type: "Other",
});

function isValidUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function ResourceLinksEditor({ value = [], onChange, readOnly = false }) {
  const links = Array.isArray(value) ? value : [];

  const update = (index, field, fieldValue) => {
    const next = [...links];
    next[index] = { ...next[index], [field]: fieldValue, updatedAt: new Date().toISOString() };
    onChange(next);
  };

  if (readOnly) {
    if (!links.length) {
      return <p className="text-sm text-[var(--text-tertiary)]">No resources yet. Add links, notes, or references for this question.</p>;
    }
    return (
      <div className="space-y-2">
        {links.map((link) => (
          <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] px-3 py-2 text-sm hover:border-[var(--accent-primary)]">
            <p className="font-medium text-[var(--text-primary)]">{link.title || link.url}</p>
            <p className="text-xs text-[var(--text-secondary)]">{link.type || "Other"}</p>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!links.length ? <p className="text-sm text-[var(--text-tertiary)]">No resources yet. Add links, notes, or references for this question.</p> : null}
      {links.map((link, index) => (
        <div key={link.id || index} className="space-y-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-soft)] p-3">
          <div className="grid gap-2 md:grid-cols-2">
            <input className="field-base w-full" placeholder="Title" value={link.title || ""} onChange={(event) => update(index, "title", event.target.value)} />
            <select className="field-base w-full" value={link.type || "Other"} onChange={(event) => update(index, "type", event.target.value)}>
              {RESOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <input
            className={`field-base w-full ${!isValidUrl(link.url) ? "border-[var(--accent-danger)]" : ""}`}
            placeholder="https://..."
            value={link.url || ""}
            onChange={(event) => update(index, "url", event.target.value)}
          />
          <div className="flex gap-2 text-xs">
            <button type="button" className="btn-base btn-neutral px-2 py-1" disabled={index === 0} onClick={() => {
              const next = [...links];
              [next[index - 1], next[index]] = [next[index], next[index - 1]];
              onChange(next);
            }}>↑</button>
            <button type="button" className="btn-base btn-neutral px-2 py-1" disabled={index === links.length - 1} onClick={() => {
              const next = [...links];
              [next[index + 1], next[index]] = [next[index], next[index + 1]];
              onChange(next);
            }}>↓</button>
            <button type="button" className="btn-base btn-neutral px-2 py-1 text-[var(--accent-danger)]" onClick={() => onChange(links.filter((_, itemIndex) => itemIndex !== index))}>Delete</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn-base btn-neutral px-3 py-1.5 text-sm" onClick={() => onChange([...links, emptyLink()])}>+ Add resource</button>
    </div>
  );
}

export default ResourceLinksEditor;
