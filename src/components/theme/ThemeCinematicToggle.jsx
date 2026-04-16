import { THEME_NAMES, useTheme } from "../../theme/themeContext";

const THEME_CONTENT = {
  [THEME_NAMES.SUPERMAN]: {
    label: "Light mode",
    icon: "https://banner2.cleanpng.com/lnd/20240602/lpj/ay80pi6xf.webp",
    fallbackIcon: "☀",
  },
  [THEME_NAMES.BATMAN]: {
    label: "Batman mode",
    icon: "https://icon2.cleanpng.com/20240227/qst/transparent-batman-batman-in-black-suit-serious-expression-1710862505969.webp",
    fallbackIcon: "◐",
  },
  [THEME_NAMES.JOKER]: {
    label: "Blue mode",
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgsnZNhidGSZ7Lwit3LkhUYr1_z5DnSvCDGw&s",
    fallbackIcon: "✦",
  },
};

export default function ThemeCinematicToggle() {
  const { theme, nextTheme, cycleTheme } = useTheme();
  const current = THEME_CONTENT[theme];
  const next = THEME_CONTENT[nextTheme];

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
        <span className="theme-cinematic-toggle__icon" aria-hidden="true">
          <span key={theme} className="theme-cinematic-toggle__icon-enter">
            <img
              src={current.icon}
              alt=""
              loading="eager"
              decoding="async"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                const fallback = event.currentTarget.nextElementSibling;
                if (fallback) fallback.hidden = false;
              }}
            />
            <span hidden>{current.fallbackIcon}</span>
          </span>
        </span>
      </span>
    </button>
  );
}
