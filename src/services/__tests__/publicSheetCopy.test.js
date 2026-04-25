import { describe, expect, it, vi } from "vitest";
import {
  buildRemixCopyTitle,
  resolveCopySourceSheetId,
  toCopyErrorMessage,
  DEFAULT_COPY_ERROR_MESSAGE,
} from "../publicSheetCopy";

describe("publicSheetCopy", () => {
  describe("buildRemixCopyTitle", () => {
    it("uses remix title with attribution when requested", () => {
      expect(
        buildRemixCopyTitle({
          sharedSheetTitle: "Graphs",
          remixTitle: "My Graph Plan",
          keepAttribution: true,
          ownerUsername: "alice",
        })
      ).toBe("My Graph Plan (Remix of @alice)");
    });

    it("falls back to source title when remix title is empty", () => {
      expect(
        buildRemixCopyTitle({
          sharedSheetTitle: "DP Master",
          remixTitle: "   ",
          keepAttribution: false,
          ownerUsername: "alice",
        })
      ).toBe("DP Master (Copy)");
    });
  });

  describe("resolveCopySourceSheetId", () => {
    it("prefers explicit source sheet id", async () => {
      const getSharedSheet = vi.fn();
      const id = await resolveCopySourceSheetId({
        sourceSheetId: "sheet-1",
        sourceShareId: "share-1",
        currentSharedSheetId: "sheet-2",
        getSharedSheet,
      });

      expect(id).toBe("sheet-1");
      expect(getSharedSheet).not.toHaveBeenCalled();
    });

    it("resolves id from share id when current id is missing", async () => {
      const getSharedSheet = vi.fn().mockResolvedValue({ id: "sheet-3" });
      const id = await resolveCopySourceSheetId({
        sourceShareId: "share-1",
        getSharedSheet,
      });

      expect(id).toBe("sheet-3");
      expect(getSharedSheet).toHaveBeenCalledWith("share-1");
    });
  });

  describe("toCopyErrorMessage", () => {
    it("maps authentication failures", () => {
      expect(toCopyErrorMessage({ status: 401 })).toBe("Your session expired. Please log in again to copy this sheet.");
    });

    it("falls back to generic message when no details exist", () => {
      expect(toCopyErrorMessage({})).toBe(DEFAULT_COPY_ERROR_MESSAGE);
    });
  });
});
