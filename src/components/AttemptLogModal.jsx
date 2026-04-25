import { useEffect, useRef, useState } from "react";

const RESULT_OPTIONS = [
  { key: "solved", label: "Solved" },
  { key: "partially_solved", label: "Partially Solved" },
  { key: "failed", label: "Error / Attempted" },
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

const formatClock = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

export function AttemptOutcomeSection({
  result,
  setResult,
  timeSpent,
  setTimeSpent,
  confidence,
  setConfidence,
  timerSeconds,
  isTimerRunning,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onUseTimerForTimeSpent,
  premiumActive = false,
  onPremiumLocked,
}) {
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
          <div className={`iqms-attempt-premium-lock ${!premiumActive ? "is-locked" : ""}`}>
            <span className="text-sm text-[var(--text-secondary)]">Time spent (minutes)</span>
            <select
              value={selectedTimeOption}
              onChange={(event) => {
                if (event.target.value === "custom") return;
                setTimeSpent(event.target.value);
              }}
              className="field-base w-full"
              disabled={!premiumActive}
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
                disabled={!premiumActive}
              />
            ) : null}
            {!premiumActive ? (
              <button type="button" className="iqms-attempt-lock-overlay" onClick={onPremiumLocked}>
                🔒 Premium
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <div className={`mt-4 rounded-md border border-[var(--border-subtle)] bg-[var(--surface)]/60 p-3 iqms-attempt-premium-lock ${!premiumActive ? "is-locked" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Focus Timer</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{formatClock(timerSeconds)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isTimerRunning ? (
              <button type="button" className="btn-base btn-neutral" onClick={onPauseTimer} disabled={!premiumActive}>Pause</button>
            ) : (
              <button type="button" className="btn-base btn-primary" onClick={onStartTimer} disabled={!premiumActive}>Start</button>
            )}
            <button type="button" className="btn-base btn-neutral" onClick={onResetTimer} disabled={!premiumActive}>Reset</button>
            <button type="button" className="btn-base btn-neutral" onClick={onUseTimerForTimeSpent} disabled={!premiumActive}>Use timer</button>
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--text-tertiary)]">Use timer to auto-fill time spent when you finish solving.</p>
        {!premiumActive ? (
          <button type="button" className="iqms-attempt-lock-overlay" onClick={onPremiumLocked}>
            🔒 Premium
          </button>
        ) : null}
      </div>

      <div className={`mt-4 iqms-attempt-premium-lock ${!premiumActive ? "is-locked" : ""}`}>
        <p className="mb-2 text-sm text-[var(--text-secondary)]">Confidence level</p>
        <div className="inline-flex flex-wrap overflow-hidden rounded-md border border-[var(--border-subtle)]">
          {CONFIDENCE_LEVELS.map((level) => (
            <button key={level} type="button" onClick={() => setConfidence(level)} className={`px-4 py-2 text-sm ${confidence === level ? "bg-[var(--accent-primary)] text-[var(--text-on-accent)]" : "bg-transparent text-[var(--text-primary)]"}`} disabled={!premiumActive}>
              {level}
            </button>
          ))}
        </div>
        {!premiumActive ? (
          <button type="button" className="iqms-attempt-lock-overlay" onClick={onPremiumLocked}>
            🔒 Premium
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function MistakeAnalysisSection({ mistakes, setMistakes, notes, setNotes, hintUsed, setHintUsed, editorialUsed, setEditorialUsed, premiumActive = false, onPremiumLocked }) {
  const toggleMistake = (mistake) => {
    setMistakes((current) => (current.includes(mistake) ? current.filter((item) => item !== mistake) : [...current, mistake]));
  };

  return (
    <section className={`${sectionClass} iqms-attempt-premium-lock ${!premiumActive ? "is-locked" : ""}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Mistake Analysis</h3>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-sm text-[var(--text-secondary)]">Mistake tags</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MISTAKES.map((mistake) => (
              <label key={mistake} className="flex items-center gap-2 rounded-md border border-[var(--border-subtle)] px-2 py-2 text-sm">
                <input type="checkbox" checked={mistakes.includes(mistake)} onChange={() => toggleMistake(mistake)} disabled={!premiumActive} />
                <span>{mistake}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <label className="block space-y-2">
            <span className="text-sm text-[var(--text-secondary)]">Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="field-base w-full" placeholder="What blocked you, and what will you do next time?" disabled={!premiumActive} />
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="rounded-md border border-[var(--border-subtle)] p-2"><span className="block text-xs text-[var(--text-tertiary)]">Hint used</span><select value={hintUsed} onChange={(e) => setHintUsed(e.target.value)} className="field-base mt-1 w-full" disabled={!premiumActive}><option>No</option><option>Yes</option></select></label>
            <label className="rounded-md border border-[var(--border-subtle)] p-2"><span className="block text-xs text-[var(--text-tertiary)]">Editorial used</span><select value={editorialUsed} onChange={(e) => setEditorialUsed(e.target.value)} className="field-base mt-1 w-full" disabled={!premiumActive}><option>No</option><option>Yes</option></select></label>
          </div>
        </div>
      </div>
      {!premiumActive ? (
        <button type="button" className="iqms-attempt-lock-overlay" onClick={onPremiumLocked}>
          🔒 Premium
        </button>
      ) : null}
    </section>
  );
}

export function RevisionPlanningSection({ revisionTiming, setRevisionTiming, solvedWithHelp, setSolvedWithHelp, attemptNumber, setAttemptNumber, submissions, setSubmissions, premiumActive = false, onPremiumLocked }) {
  return (
    <section className={`${sectionClass} iqms-attempt-premium-lock ${!premiumActive ? "is-locked" : ""}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Revision Planning</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Revision timing</span><select value={revisionTiming} onChange={(event) => setRevisionTiming(event.target.value)} className="field-base w-full" disabled={!premiumActive}>{REVISION_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Solved independently</span><select value={solvedWithHelp} onChange={(event) => setSolvedWithHelp(event.target.value)} className="field-base w-full" disabled={!premiumActive}><option value="independent">Independent</option><option value="with_help">With help</option></select></label>
        <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Attempt number</span><input type="number" min="1" step="1" value={attemptNumber} onChange={(event) => setAttemptNumber(event.target.value)} className="field-base w-full" disabled={!premiumActive} /></label>
        <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]"># submissions</span><input type="number" min="1" step="1" value={submissions} onChange={(event) => setSubmissions(event.target.value)} className="field-base w-full" disabled={!premiumActive} /></label>
      </div>
      {!premiumActive ? (
        <button type="button" className="iqms-attempt-lock-overlay" onClick={onPremiumLocked}>
          🔒 Premium
        </button>
      ) : null}
    </section>
  );
}

function LogAttemptModal({ questionText, questionLink, topicName, onClose, onSave, premiumActive = false, onPremiumLocked }) {
  const [result, setResult] = useState("partially_solved");
  const [timeSpent, setTimeSpent] = useState("40");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);
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

  useEffect(() => {
    if (!isTimerRunning) {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return undefined;
    }

    timerIntervalRef.current = window.setInterval(() => {
      setTimerSeconds((current) => current + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isTimerRunning]);

  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => setIsTimerRunning(false);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };
  const useTimerForTimeSpent = () => {
    const minutesFromTimer = Math.max(1, Math.ceil(timerSeconds / 60));
    setTimeSpent(String(minutesFromTimer));
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-3 backdrop-blur-sm sm:p-4">
      <div className="panel flex max-h-[92dvh] w-full max-w-5xl flex-col rounded-2xl border shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">Log Attempt</h2>
            <p className="text-sm text-[var(--text-secondary)]">Capture attempt quality, learning signals, and revision planning.</p>
          </div>
          <button type="button" className="text-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <section className={`${sectionClass} iqms-attempt-premium-lock ${!premiumActive ? "is-locked" : ""}`}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Attempt Summary</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1 text-sm lg:col-span-2"><span className="text-[var(--text-secondary)]">Problem</span><input value={problemName} disabled className="field-base w-full opacity-80" /></label>
              <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Platform</span><input value={platform} onChange={(event) => setPlatform(event.target.value)} className="field-base w-full" disabled={!premiumActive} /></label>
              <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Topic (optional)</span><input value={topic} onChange={(event) => setTopic(event.target.value)} className="field-base w-full" disabled={!premiumActive} /></label>
              <label className="space-y-1 text-sm"><span className="text-[var(--text-secondary)]">Difficulty (optional)</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="field-base w-full" disabled={!premiumActive}>{DIFFICULTY_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
            </div>
            {!premiumActive ? (
              <button type="button" className="iqms-attempt-lock-overlay" onClick={onPremiumLocked}>
                🔒 Premium
              </button>
            ) : null}
          </section>

          <AttemptOutcomeSection
            result={result}
            setResult={setResult}
            timeSpent={timeSpent}
            setTimeSpent={setTimeSpent}
            confidence={confidence}
            setConfidence={setConfidence}
            timerSeconds={timerSeconds}
            isTimerRunning={isTimerRunning}
            onStartTimer={startTimer}
            onPauseTimer={pauseTimer}
            onResetTimer={resetTimer}
            onUseTimerForTimeSpent={useTimerForTimeSpent}
            premiumActive={premiumActive}
            onPremiumLocked={onPremiumLocked}
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
            premiumActive={premiumActive}
            onPremiumLocked={onPremiumLocked}
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
            premiumActive={premiumActive}
            onPremiumLocked={onPremiumLocked}
          />
        </div>

        <footer className="flex flex-col gap-3 border-t border-[var(--border-subtle)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-[var(--text-tertiary)]">This attempt will update learning analytics and revision alerts.</p>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button type="button" onClick={onClose} className="btn-base btn-neutral">Cancel</button>
            <button type="button" onClick={handleSave} className="btn-base btn-primary">Save Attempt</button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LogAttemptModal;
