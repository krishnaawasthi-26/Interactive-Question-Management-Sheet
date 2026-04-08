import { useMemo, useState } from "react";

const RESULT_OPTIONS = [
  { key: "solved", label: "Solved", icon: "✓", className: "bg-emerald-500 hover:bg-emerald-600" },
  { key: "partially_solved", label: "Partially Solved", icon: "✓", className: "bg-amber-500 hover:bg-amber-600" },
  { key: "failed", label: "Failed", icon: "✕", className: "bg-rose-500 hover:bg-rose-600" },
];

const MISTAKES = [
  "Wrong Approach",
  "Off by One Error",
  "Syntax / Coding Bug",
  "Missed Edge Case",
  "Forgot Concept",
  "Time Limit Exceeded",
];

const CONFIDENCE_LEVELS = ["Low", "Medium", "High"];
const REVISION_OPTIONS = ["Tomorrow", "In 2 Days", "In 1 Week", "In 2 Weeks"];

function AttemptLogModal({ questionText, onClose, onSave }) {
  const [result, setResult] = useState("partially_solved");
  const [timeSpent, setTimeSpent] = useState("40 minutes");
  const [mistakes, setMistakes] = useState(["Off by One Error"]);
  const [notes, setNotes] = useState("");
  const [confidence, setConfidence] = useState("Medium");
  const [revision, setRevision] = useState("In 2 Days");

  const splitMistakes = useMemo(() => ({
    left: MISTAKES.slice(0, 3),
    right: MISTAKES.slice(3),
  }), []);

  const toggleMistake = (mistake) => {
    setMistakes((current) =>
      current.includes(mistake)
        ? current.filter((item) => item !== mistake)
        : [...current, mistake]
    );
  };

  const handleSave = () => {
    onSave({
      result,
      timeSpent,
      mistakes,
      notes,
      confidence,
      revision,
      loggedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-2xl font-semibold">Log Your Attempt</h2>
          <button type="button" className="text-2xl text-slate-400 hover:text-slate-600" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="h-px bg-slate-200" />

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-1 text-sm">
            <p><span className="font-semibold">Problem:</span> {questionText}</p>
            <p><span className="font-semibold">Platform:</span> LeetCode</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Result:</p>
            <div className="flex flex-wrap gap-2">
              {RESULT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setResult(option.key)}
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition ${option.className} ${
                    result === option.key ? "ring-2 ring-offset-2 ring-slate-300" : "opacity-80"
                  }`}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Time Spent</p>
            <div className="relative max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🕒</span>
              <select
                value={timeSpent}
                onChange={(event) => setTimeSpent(event.target.value)}
                className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm outline-none focus:border-blue-500"
              >
                <option>20 minutes</option>
                <option>30 minutes</option>
                <option>40 minutes</option>
                <option>60 minutes</option>
                <option>90 minutes</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">▾</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">What mistakes did you make?</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[splitMistakes.left, splitMistakes.right].map((column, columnIndex) => (
                <div key={columnIndex} className="space-y-2">
                  {column.map((mistake) => (
                    <label key={mistake} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={mistakes.includes(mistake)}
                        onChange={() => toggleMistake(mistake)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{mistake}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Notes:</p>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="e.g. Forgot to shrink the window, struggled with deque implementation."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Confidence Level:</p>
            <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
              {CONFIDENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfidence(level)}
                  className={`px-4 py-2 text-sm font-medium ${
                    confidence === level
                      ? "bg-amber-500 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Add to Revision:</p>
            <div className="relative max-w-xs">
              <select
                value={revision}
                onChange={(event) => setRevision(event.target.value)}
                className="w-full appearance-none rounded-md border border-slate-300 bg-white px-3 py-2 pr-8 text-sm outline-none focus:border-blue-500"
              >
                {REVISION_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">▾</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-slate-200" />
        <div className="flex justify-end gap-2 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Save Attempt
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttemptLogModal;
