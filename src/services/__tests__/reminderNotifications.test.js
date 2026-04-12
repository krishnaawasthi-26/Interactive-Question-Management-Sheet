import { describe, expect, it } from "vitest";
import { getDueRemindersLatestFirst, isDueReminderNotification, toNotificationEventKey } from "../reminderNotifications";

describe("reminderNotifications", () => {
  it("detects due reminder notifications by type, status, and time", () => {
    const now = new Date("2026-04-12T10:00:00.000Z").getTime();
    expect(isDueReminderNotification({ type: "alarm", status: "unread", scheduledFor: "2026-04-12T09:59:00.000Z" }, now)).toBe(true);
    expect(isDueReminderNotification({ type: "platform", status: "unread", scheduledFor: "2026-04-12T09:59:00.000Z" }, now)).toBe(false);
    expect(isDueReminderNotification({ type: "alarm", status: "read", scheduledFor: "2026-04-12T09:59:00.000Z" }, now)).toBe(false);
    expect(isDueReminderNotification({ type: "alarm", status: "unread", scheduledFor: "2026-04-12T10:01:00.000Z" }, now)).toBe(false);
  });

  it("returns due reminders latest first", () => {
    const now = new Date("2026-04-12T10:00:00.000Z").getTime();
    const items = [
      { id: "a", type: "alarm", status: "unread", scheduledFor: "2026-04-12T09:58:00.000Z" },
      { id: "b", type: "revision", status: "overdue", scheduledFor: "2026-04-12T09:59:30.000Z" },
      { id: "c", type: "alarm", status: "unread", scheduledFor: "2026-04-12T10:05:00.000Z" },
    ];

    expect(getDueRemindersLatestFirst(items, now).map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("creates event keys that include id and schedule", () => {
    expect(toNotificationEventKey({ id: "n-1", scheduledFor: "2026-04-12T09:58:00.000Z" })).toBe("n-1:2026-04-12T09:58:00.000Z");
  });
});
