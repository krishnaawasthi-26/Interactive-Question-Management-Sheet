import { THEME_NAMES, useTheme } from "../../theme/themeContext";

const THEME_CONTENT = {
  [THEME_NAMES.SUPERMAN]: {
    label: "Superman light",
    icon: "☀",
    cue: "Uplift",
  },
  [THEME_NAMES.BATMAN]: {
    label: "Batman dark",
    icon: "◐",
    cue: "Stealth",
  },
  [THEME_NAMES.JOKER]: {
    label: "Joker blue",
    icon: "✦",
    cue: "Chaos",
  },
};

export default function ThemeCinematicToggle() {
  const { theme, nextTheme, cycleTheme, switchCount, jokerTriggerCount } = useTheme();
  const current = THEME_CONTENT[theme];
  const next = THEME_CONTENT[nextTheme];
  const switchesRemaining = Math.max(jokerTriggerCount - (switchCount % jokerTriggerCount), 0);

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="theme-cinematic-toggle"
      aria-label={`Current ${current.label}. Switch to ${next.label}`}
      title={`Current ${current.label} • Next ${next.label}`}
    >
      <span className="theme-cinematic-toggle__halo" aria-hidden="true" />
      <span className="theme-cinematic-toggle__content">
        <span className="theme-cinematic-toggle__icon" aria-hidden="true">{current.icon}</span>
        <span className="theme-cinematic-toggle__meta">
          <span className="theme-cinematic-toggle__label">{current.label}</span>
          <span className="theme-cinematic-toggle__hint">
            Next: {next.label}
            {theme === THEME_NAMES.JOKER ? " • Counter reset" : ` • Joker in ${switchesRemaining}`}
          </span>
        </span>
        <span className="theme-cinematic-toggle__cue" aria-hidden="true">{next.cue}</span>
      </span>
    </button>
  );
}
