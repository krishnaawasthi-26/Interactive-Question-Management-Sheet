import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPremiumAccess, isPremiumActive } from "../premium";

describe("premium service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats active trial as premium", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const user = {
      premiumTrialEndsAt: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
      premiumAccessType: "trial",
    };

    const access = getPremiumAccess(user);

    expect(access.premiumActive).toBe(true);
    expect(access.isTrialPremium).toBe(true);
    expect(isPremiumActive(user)).toBe(true);
  });

  it("marks expired trial as non-premium", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const user = {
      premiumTrialEndsAt: new Date(now - 60_000).toISOString(),
      premiumActive: false,
    };

    const access = getPremiumAccess(user);

    expect(access.premiumActive).toBe(false);
    expect(access.isTrialPremium).toBe(false);
  });
});
