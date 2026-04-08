import { useState } from "react";
import { validateSheetJson } from "../services/importValidation";
import { useSheetStore } from "../store/sheetStore";
import AppShell from "../components/AppShell";

function ImportPage({ theme, onThemeChange, onBack }) {
  const setFullSheet = useSheetStore((state) => state.setFullSheet);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");

  const onFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
      setErrors(["Only JSON files are allowed for import."]);
      setMessage("");
      return;
    }
    const content = await file.text();
    try {
      const parsed = JSON.parse(content);
      const validation = validateSheetJson(parsed);
      if (!validation.valid) {
        setErrors(validation.errors);
        setMessage("");
        return;
      }
      await setFullSheet(validation.normalized);
      setErrors([]);
      setMessage("Sheet imported successfully.");
    } catch {
      setErrors(["Invalid JSON file."]);
      setMessage("");
    }
  };

  return (
    <AppShell title="Import Sheet JSON" subtitle="Upload validated JSON data into the current sheet" theme={theme} onThemeChange={onThemeChange}>
      <div className="panel p-6">
        <p className="mb-3 text-sm text-[var(--text-secondary)]">Import works with JSON only. Required fields: <code>name</code>, <code>topics</code>, topic <code>title</code>, subtopic <code>title</code>, question <code>text</code>.</p>
        <a href="/sample-import-sheet.json" download className="btn-base btn-neutral mb-4 inline-block">Download sample JSON file</a>
        <input type="file" accept="application/json,.json" onChange={onFileChange} className="field-base mb-4 block w-full" />
        {message && <p className="mb-3 text-[var(--accent-success)]">{message}</p>}
        {errors.length > 0 && <ul className="mb-4 list-disc space-y-1 rounded-md border border-[color-mix(in_srgb,var(--accent-danger)_55%,transparent)] bg-[color-mix(in_srgb,var(--accent-danger)_11%,var(--surface-elevated))] p-4 pl-8 text-sm text-[#ffc9c9]">{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
        <button type="button" onClick={onBack} className="btn-base btn-neutral">Back to App</button>
      </div>
    </AppShell>
  );
}

export default ImportPage;
