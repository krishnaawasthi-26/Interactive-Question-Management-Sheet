import { useMemo, useState } from "react";

const formatTime = (isoValue) => {
  if (!isoValue) return "Not set";
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString();
};

function TopicReminderAlarmPanel({
  open,
  mode,
  topics,
  scheduledAlerts,
  onModeChange,
  onSave,
  onDelete,
  onClose,
}) {
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const activeTopicOptions = useMemo(
    () =>
      topics.map((topic) => ({
        id: topic.id,
        title: topic.title || "Untitled Topic",
      })),
    [topics]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4">
      <section className="w-full max-w-xl rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Clock-style topic scheduler</h2>
          <button type="button" className="btn-base btn-neutral px-3 py-1.5 text-sm" onClick={onClose}>Close</button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`btn-base rounded-xl px-3 py-2 text-sm ${mode === "reminder" ? "btn-primary" : "btn-outline"}`}
            onClick={() => onModeChange("reminder")}
          >
            ⏰ Reminder
          </button>
          <button
            type="button"
            className={`btn-base rounded-xl px-3 py-2 text-sm ${mode === "alarm" ? "btn-danger" : "btn-outline"}`}
            onClick={() => onModeChange("alarm")}
          >
            🔔 Alarm
          </button>
        </div>

        <div className="mb-5 rounded-full border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top,_color-mix(in_srgb,var(--accent-primary)_30%,transparent),_var(--surface-elevated)_62%)] p-5 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Schedule time</p>
          <p className="mt-1 text-3xl font-semibold">{scheduledFor ? new Date(scheduledFor).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--text-secondary)]">Topic</span>
            <select
              className="field-base w-full"
              value={selectedTopicId}
              onChange={(event) => setSelectedTopicId(event.target.value)}
            >
              <option value="">Select topic</option>
              {activeTopicOptions.map((topic) => (
                <option key={topic.id} value={topic.id}>{topic.title}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--text-secondary)]">Date & time</span>
            <input
              className="field-base w-full"
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) => setScheduledFor(event.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className="btn-base btn-primary mt-4 w-full py-2"
          onClick={() => {
            if (!selectedTopicId || !scheduledFor) return;
            onSave({ topicId: selectedTopicId, scheduledFor, mode });
            setScheduledFor("");
            setSelectedTopicId("");
          }}
        >
          Save {mode === "alarm" ? "Alarm" : "Reminder"}
        </button>

        <div className="mt-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Upcoming</p>
          {scheduledAlerts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border-subtle)] p-3 text-sm text-[var(--text-secondary)]">
              No reminders or alarms scheduled yet.
            </p>
          ) : (
            scheduledAlerts.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2">
                <div>
                  <p className="text-sm">
                    {item.mode === "alarm" ? "🔔 Alarm" : "⏰ Reminder"} • {item.topicTitle}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">{formatTime(item.scheduledFor)}</p>
                </div>
                <button type="button" className="btn-base btn-neutral px-2 py-1 text-xs" onClick={() => onDelete(item.id)}>Remove</button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default TopicReminderAlarmPanel;
