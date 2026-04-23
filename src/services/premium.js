const toTimestamp = (value) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getPremiumAccess = (user) => {
  if (!user) {
    return {
      premiumActive: false,
      premiumAccessType: "none",
      premiumExpiresAt: null,
      premiumTrialEndsAt: null,
      premiumTrialStartedAt: null,
      premiumGrantedReason: null,
      hadFreePremiumTrial: false,
      isTrialPremium: false,
      isPaidPremium: false,
    };
  }

  const now = Date.now();
  const premiumUntilMs = toTimestamp(user.premiumUntil);
  const premiumTrialEndsMs = toTimestamp(user.premiumTrialEndsAt);

  const isPaidPremium = premiumUntilMs > now;
  const isTrialPremium = premiumTrialEndsMs > now && !isPaidPremium;
  const premiumActive = isPaidPremium || isTrialPremium || Boolean(user.premiumActive);
  const premiumAccessType = isPaidPremium
    ? "paid"
    : isTrialPremium
      ? "trial"
      : user.premiumAccessType || (premiumActive ? "paid" : "none");

  return {
    premiumActive,
    premiumAccessType,
    premiumExpiresAt: user.premiumExpiresAt || (isPaidPremium ? user.premiumUntil : isTrialPremium ? user.premiumTrialEndsAt : null),
    premiumTrialEndsAt: user.premiumTrialEndsAt || null,
    premiumTrialStartedAt: user.premiumTrialStartedAt || null,
    premiumGrantedReason: user.premiumGrantedReason || null,
    hadFreePremiumTrial: Boolean(user.hadFreePremiumTrial),
    isTrialPremium,
    isPaidPremium,
  };
};

export const isPremiumActive = (user) => getPremiumAccess(user).premiumActive;
