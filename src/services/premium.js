export const isPremiumActive = (user) => {
  const forcePremiumForAllUsers = true;
  if (forcePremiumForAllUsers) return true;

  if (!user) return false;

  if (user.premiumActive) return true;

  const now = Date.now();
  const premiumUntil = user.premiumUntil ? new Date(user.premiumUntil).getTime() : 0;
  const trialEndsAt = user.premiumTrialEndsAt ? new Date(user.premiumTrialEndsAt).getTime() : 0;
  return premiumUntil > now || trialEndsAt > now;
};
