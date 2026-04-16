import { useEffect, useRef } from "react";
import { THEME_NAMES, useTheme } from "../../theme/themeContext";

const THEME_CONTENT = {
  [THEME_NAMES.SUPERMAN]: {
    label: "Light mode",
    icon: "https://banner2.cleanpng.com/lnd/20240602/lpj/ay80pi6xf.webp",
    fallbackIcon: "☀",
    cue: "Uplift",
  },
  [THEME_NAMES.BATMAN]: {
    label: "Batman mode",
    icon: "https://icon2.cleanpng.com/20240227/qst/transparent-batman-batman-in-black-suit-serious-expression-1710862505969.webp",
    fallbackIcon: "◐",
    batSymbol: "https://www.vhv.rs/dpng/d/220-2208569_bat-silhouette-new-batman-adventures-symbol-hd-png.png",
    cue: "Stealth",
  },
  [THEME_NAMES.JOKER]: {
    label: "Blue mode",
    icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgsnZNhidGSZ7Lwit3LkhUYr1_z5DnSvCDGw&s",
    fallbackIcon: "✦",
    cue: "Blue",
  },
};

export default function ThemeCinematicToggle() {
  const { theme, nextTheme, cycleTheme, switchCount, jokerTriggerCount } = useTheme();
  const toggleRef = useRef(null);
  const current = THEME_CONTENT[theme];
  const next = THEME_CONTENT[nextTheme];
  const switchesRemaining = Math.max(jokerTriggerCount - (switchCount % jokerTriggerCount), 0);

  useEffect(() => {
    const root = document.documentElement;
    if (!root || !toggleRef.current) return undefined;

    const syncBatmanPath = () => {
      const toggleRect = toggleRef.current?.getBoundingClientRect();
      if (!toggleRect) return;

      const logoutButton = document.querySelector('.sidebar-desktop .sidebar-footer [aria-label="Log Out"]');
      const logoutRect = logoutButton?.getBoundingClientRect();

      const startX = logoutRect ? logoutRect.left + (logoutRect.width / 2) : 24;
      const startY = logoutRect ? logoutRect.bottom : (window.innerHeight - 48);
      const endX = toggleRect.left + (toggleRect.width / 2);
      const endY = toggleRect.top + (toggleRect.height / 2);

      root.style.setProperty("--bat-flight-start-x", `${Math.round(startX)}px`);
      root.style.setProperty("--bat-flight-start-y", `${Math.round(startY)}px`);
      root.style.setProperty("--bat-flight-dx", `${Math.round(endX - startX)}px`);
      root.style.setProperty("--bat-flight-dy", `${Math.round(endY - startY)}px`);
    };

    syncBatmanPath();
    window.addEventListener("resize", syncBatmanPath);
    window.addEventListener("scroll", syncBatmanPath, true);

    return () => {
      window.removeEventListener("resize", syncBatmanPath);
      window.removeEventListener("scroll", syncBatmanPath, true);
    };
  }, []);

  return (
    <button
      ref={toggleRef}
      type="button"
      onClick={cycleTheme}
      className="theme-cinematic-toggle"
      aria-label={`Current ${current.label}. Switch to ${next.label}`}
      title={`Current ${current.label} • Next ${next.label}`}
    >
      <span className="theme-cinematic-toggle__halo" aria-hidden="true" />
      <span className="theme-cinematic-toggle__scene" aria-hidden="true">
        <span className="theme-cinematic-toggle__light-beam theme-cinematic-toggle__light-beam--left" />
        <span className="theme-cinematic-toggle__light-beam theme-cinematic-toggle__light-beam--right" />
        <img
          src={THEME_CONTENT[THEME_NAMES.BATMAN].batSymbol}
          alt=""
          className="theme-cinematic-toggle__bat-sweep"
          onError={(event) => { event.currentTarget.style.display = "none"; }}
        />
      </span>
      <span className="theme-cinematic-toggle__content">
        <span className="theme-cinematic-toggle__icon" aria-hidden="true">
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
