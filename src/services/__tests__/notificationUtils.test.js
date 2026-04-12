import { describe, expect, it } from "vitest";
import { buildNotificationSections, isActiveNotification, isArchivedNotification } from "../notificationUtils";

describe("notificationUtils", () => {
  it("classifies archived notifications", () => {
    expect(isArchivedNotification({ status: "archived" })).toBe(true);
    expect(isArchivedNotification({ status: "unread" })).toBe(false);
  });

  it("classifies active notifications", () => {
    expect(isActiveNotification({ status: "unread" })).toBe(true);
    expect(isActiveNotification({ status: "read" })).toBe(true);
    expect(isActiveNotification({ status: "overdue" })).toBe(true);
    expect(isActiveNotification({ status: "archived" })).toBe(false);
    expect(isActiveNotification({ status: "completed" })).toBe(false);
  });

  it("builds all, active, and archived sections", () => {
    const notifications = [
      { id: "1", status: "unread", type: "alarm" },
      { id: "2", status: "archived", type: "platform" },
      { id: "3", status: "read", type: "revision" },
    ];

    const sections = buildNotificationSections(notifications);
    expect(sections.all.map((item) => item.id)).toEqual(["1", "2", "3"]);
    expect(sections.active.map((item) => item.id)).toEqual(["1", "3"]);
    expect(sections.archived.map((item) => item.id)).toEqual(["2"]);
  });
});
