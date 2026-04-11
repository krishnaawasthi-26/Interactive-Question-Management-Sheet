export const isPremiumActive = (user) => {
  if (!user) return false;

  // Testing mode: treat every signed-in username as premium.
  if (typeof user.username === "string" && user.username.trim()) return true;
  if (user.premiumActive) return true;

  const now = Date.now();
  const premiumUntil = user.premiumUntil ? new Date(user.premiumUntil).getTime() : 0;
  const trialEndsAt = user.premiumTrialEndsAt ? new Date(user.premiumTrialEndsAt).getTime() : 0;
  return premiumUntil > now || trialEndsAt > now;
};
