import { useState } from "react";
import { validateSheetJson } from "../services/importValidation";
import { useSheetStore } from "../store/sheetStore";

function ImportPage({ onBack }) {
  const setFullSheet = useSheetStore((state) => state.setFullSheet);
  const [errors, setErrors] = useState([]);
  const [message, setMessage] = useState("");

  const onFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
    <div className="mx-auto max-w-3xl px-6 py-10 text-white">
      <h1 className="mb-4 text-2xl font-semibold">Import Sheet JSON</h1>
      <p className="mb-3 text-sm text-zinc-300">
        Upload JSON with required fields: <code>name</code>, <code>topics</code>, each topic
        needs <code>title</code>, each subtopic needs <code>title</code>, and each question
        needs <code>text</code>.
      </p>

      <input
        type="file"
        accept="application/json"
        onChange={onFileChange}
        className="mb-4 block w-full rounded-md border border-gray-700 p-3"
      />

      {message && <p className="mb-3 text-emerald-300">{message}</p>}
      {errors.length > 0 && (
        <ul className="mb-4 list-disc space-y-1 rounded-md border border-rose-800 bg-rose-950/30 p-4 pl-8 text-sm text-rose-200">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onBack}
        className="rounded-md border border-gray-700 px-4 py-2 text-sm"
      >
        Back to App
      </button>
    </div>
  );
}

export default ImportPage;
