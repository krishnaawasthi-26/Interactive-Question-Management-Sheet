import { useState } from "react";

const RESULT_OPTIONS = [
  { key: "solved", label: "Solved" },
  { key: "partially_solved", label: "Partially Solved" },
  { key: "failed", label: "Failed" },
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
const REVISION_OPTIONS = ["Today", "Tomorrow", "In 2 Days", "In 1 Week", "In 2 Weeks", "Never"];
const TIME_SPENT_OPTIONS = ["5", "10", "15", "20", "30", "45", "60"];
const DIFFICULTY_OPTIONS = ["Unspecified", "Easy", "Medium", "Hard"];

const getPlatformFromLink = (link) => {
  if (!link) return "LeetCode";
  if (link.includes("leetcode")) return "LeetCode";
  if (link.includes("codeforces")) return "Codeforces";
  if (link.includes("hackerrank")) return "HackerRank";
  if (link.includes("geeksforgeeks")) return "GeeksforGeeks";
  return "Other";
};

const toRevisionDate = (revisionTiming) => {
  if (revisionTiming === "Never") return null;
  const offsetDays = {
    Today: 0,
    Tomorrow: 1,
    "In 2 Days": 2,
    "In 1 Week": 7,
    "In 2 Weeks": 14,
  };
  const date = new Date();
  date.setDate(date.getDate() + (offsetDays[revisionTiming] ?? 2));
  return date.toISOString();
};

const sectionClass = "rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4";

export function AttemptOutcomeSection({ result, setResult, timeSpent, setTimeSpent, confidence, setConfidence }) {
  const selectedTimeOption = TIME_SPENT_OPTIONS.includes(String(timeSpent)) ? String(timeSpent) : "custom";

  return (
    <section className={sectionClass}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Outcome</h3>
      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="mb-2 text-sm text-[var(--text-secondary)]">Result</p>
          <div className="flex flex-wrap gap-2">
            {RESULT_OPTIONS.map((option) => (
              <button key={option.key} type="button" onClick={() => setResult(option.key)} className={`rounded-md border px-3 py-2 text-sm ${result === option.key ? "border-[var(--accent-primary)]" : "border-[var(--border-subtle)]"}`} style={result === option.key ? { background: "color-mix(in srgb, var(--accent-primary) 18%, var(--surface-elevated))" } : undefined}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <span className="text-sm text-[var(--text-secondary)]">Time spent (minutes)</span>
          <select
            value={selectedTimeOption}
            onChange={(event) => {
              if (event.target.value === "custom") return;
              setTimeSpent(event.target.value);
            }}
            className="field-base w-full"
          >
            {TIME_SPENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} min
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          {selectedTimeOption === "custom" ? (
            <input
              type="number"
              min="1"
              step="1"
              value={timeSpent}
              onChange={(event) => setTimeSpent(event.target.value)}
              className="field-base w-full"
              placeholder="Enter custom minutes"
            />
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-sm text-[var(--text-secondary)]">Confidence level</p>
        <div className="inline-flex overflow-hidden rounded-md border border-[var(--border-subtle)]">
          {CONFIDENCE_LEVELS.map((level) => (
            <button key={level} type="button" onClick={() => setConfidence(level)} className={`px-4 py-2 text-sm ${confidence === level ? "bg-[var(--accent-primary)] text-black" : "bg-transparent text-[var(--text-primary)]"}`}>
              {level}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MistakeAnalysisSection({ mistakes, setMistakes, notes, setNotes, hintUsed, setHintUsed, editorialUsed, setEditorialUsed }) {
  const toggleMistake = (mistake) => {
    setMistakes((current) => (current.includes(mistake) ? current.filter((item) => item !== mistake) : [...current, mistake]));
  };

  return (
    <section className={sectionClass}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Mistake Analysis</h3>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm text-[var(--text-secondary)]">Mistake tags</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MISTAKES.map((mistake) => (
              <label key={mistake} className="flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-2 py-2 text-sm">
                <input type="checkbox" checked={mistakes.includes(mistake)} onChange={() => toggleMistake(mistake)} />
                <span>{mistake}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <label className="block space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="field-base w-full" placeholder="What blocked you, and what will you do next time?" />
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="rounded-md border border-[var(--border-subtle)] p-2"><span className="block text-xs text-[var(--text-tertiary)]">Hint used</span><select value={hintUsed} onChange={(e) => setHintUsed(e.target.value)} className="field-base mt-1 w-full"><option>No</option><option>Yes</option></select></label>
            <label className="rounded-md border border-[var(--border-subtle)] p-2"><span className="block text-xs text-[var(--text-tertiary)]">Editorial used</span><select value={editorialUsed} onChange={(e) => setEditorialUsed(e.target.value)} className="field-base mt-1 w-full"><option>No</option><option>Yes</option></select></label>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RevisionPlanningSection({ revisionTiming, setRevisionTiming, solvedWithHelp, setSolvedWithHelp, attemptNumber, setAttemptNumber, submissions, setSubmissions }) {
  return (
    <section className={sectionClass}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Revision Planning</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Revision timing</span><select value={revisionTiming} onChange={(event) => setRevisionTiming(event.target.value)} className="field-base w-full">{REVISION_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Solved independently</span><select value={solvedWithHelp} onChange={(event) => setSolvedWithHelp(event.target.value)} className="field-base w-full"><option value="independent">Independent</option><option value="with_help">With help</option></select></label>
        <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Attempt number</span><input type="number" min="1" step="1" value={attemptNumber} onChange={(event) => setAttemptNumber(event.target.value)} className="field-base w-full" /></label>
        <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]"># submissions</span><input type="number" min="1" step="1" value={submissions} onChange={(event) => setSubmissions(event.target.value)} className="field-base w-full" /></label>
      </div>
    </section>
  );
}

function LogAttemptModal({ questionText, questionLink, topicName, onClose, onSave }) {
  const [result, setResult] = useState("partially_solved");
  const [timeSpent, setTimeSpent] = useState("40");
  const [mistakes, setMistakes] = useState(["Off by One Error"]);
  const [notes, setNotes] = useState("");
  const [confidence, setConfidence] = useState("Medium");
  const [revisionTiming, setRevisionTiming] = useState("In 2 Days");

  const [platform, setPlatform] = useState(getPlatformFromLink(questionLink));
  const [difficulty, setDifficulty] = useState("Unspecified");
  const [hintUsed, setHintUsed] = useState("No");
  const [editorialUsed, setEditorialUsed] = useState("No");
  const [attemptNumber, setAttemptNumber] = useState("1");
  const [solvedWithHelp, setSolvedWithHelp] = useState("independent");
  const [submissions, setSubmissions] = useState("1");

  const [problemName] = useState(questionText);
  const [topic, setTopic] = useState(topicName || "General");

  const handleSave = () => {
    const normalizedTimeSpent = Math.max(1, Number(timeSpent) || 1);

    onSave({
      problemName,
      platform,
      result,
      timeSpent: `${normalizedTimeSpent} minutes`,
      mistakes,
      notes,
      confidence,
      revision: revisionTiming,
      revisionTiming,
      revisionDate: toRevisionDate(revisionTiming),
      topic,
      difficulty,
      hintUsed: hintUsed === "Yes",
      editorialUsed: editorialUsed === "Yes",
      attemptNumber: Number(attemptNumber) || 1,
      solvedWithHelp,
      submissions: Number(submissions) || 1,
      loggedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-5xl rounded-2xl border shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <div>
            <h2 className="text-2xl font-semibold">Log Attempt</h2>
            <p className="text-sm text-[var(--text-secondary)]">Capture attempt quality, learning signals, and revision planning.</p>
          </div>
          <button type="button" className="text-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto px-6 py-5">
          <section className={sectionClass}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Attempt Summary</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1 text-sm lg:col-span-2"><span className="text-[var(--text-secondary)]">Problem</span><input value={problemName} disabled className="field-base w-full opacity-80" /></label>
              <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Platform</span><input value={platform} onChange={(event) => setPlatform(event.target.value)} className="field-base w-full" /></label>
              <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Topic (optional)</span><input value={topic} onChange={(event) => setTopic(event.target.value)} className="field-base w-full" /></label>
              <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Difficulty (optional)</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="field-base w-full">{DIFFICULTY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            </div>
          </section>

          <AttemptOutcomeSection
            result={result}
            setResult={setResult}
            timeSpent={timeSpent}
            setTimeSpent={setTimeSpent}
            confidence={confidence}
            setConfidence={setConfidence}
          />

          <MistakeAnalysisSection
            mistakes={mistakes}
            setMistakes={setMistakes}
            notes={notes}
            setNotes={setNotes}
            hintUsed={hintUsed}
            setHintUsed={setHintUsed}
            editorialUsed={editorialUsed}
            setEditorialUsed={setEditorialUsed}
          />

          <RevisionPlanningSection
            revisionTiming={revisionTiming}
            setRevisionTiming={setRevisionTiming}
            solvedWithHelp={solvedWithHelp}
            setSolvedWithHelp={setSolvedWithHelp}
            attemptNumber={attemptNumber}
            setAttemptNumber={setAttemptNumber}
            submissions={submissions}
            setSubmissions={setSubmissions}
          />
        </div>

        <footer className="flex items-center justify-between border-t border-[var(--border-subtle)] px-6 py-4">
          <p className="text-xs text-[var(--text-tertiary)]">This attempt will update learning analytics and revision alerts.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-base btn-neutral">Cancel</button>
            <button type="button" onClick={handleSave} className="btn-base btn-primary">Save Attempt</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LogAttemptModal;
