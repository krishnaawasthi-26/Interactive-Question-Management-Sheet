import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getCurrentRoute, getUserProfileRoute, navigateTo, ROUTES } from "../services/routes";
import { useAuthStore } from "../store/authStore";
import { getPremiumAccess } from "../services/premium";
import ConfirmationModal from "./ConfirmationModal";

const sections = [
  {
    title: "Workspace",
    items: [
      { label: "Home", route: ROUTES.HOME, icon: "⌂" },
      { label: "Sheets", route: ROUTES.APP, icon: "▦" },
      { label: "Profile", route: ROUTES.PROFILE, icon: "◉" },
      { label: "Premium", route: ROUTES.PREMIUM, icon: "✦" },
      { label: "Inbox", route: ROUTES.NOTIFICATIONS, icon: "✉", matchRoutes: [ROUTES.NOTIFICATIONS, ROUTES.ALERTS] },
      { label: "Reminders", route: ROUTES.ALARMS, icon: "⏱" },
    ],
  },
  {
    title: "Discover",
    items: [
      { label: "Insights", route: ROUTES.LEARNING_INSIGHTS, icon: "◌" },
      { label: "Public Sheets", route: ROUTES.PUBLIC_SHEETS, icon: "◎" },
      { label: "How To Use", route: ROUTES.HOW_TO_USE, icon: "?" },
      { label: "About", route: ROUTES.ABOUT, icon: "i" },
    ],
  },
];

function SidebarItem({
  item,
  isOpen,
  active,
  onClick,
  showTooltip = true,
  compact = false,
  locked = false,
}) {
  const tooltipId = useId();
  const buttonRef = useRef(null);
  const tooltipRef = useRef(null);
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState(null);
  const shouldShowFloatingLabel = !isOpen && showTooltip;

  useEffect(() => {
    if (!shouldShowFloatingLabel || !isTooltipVisible) return;
    const buttonNode = buttonRef.current;
    const tooltipNode = tooltipRef.current;
    if (!buttonNode || !tooltipNode) return;

    const buttonRect = buttonNode.getBoundingClientRect();
    const tooltipRect = tooltipNode.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edgePadding = 8;
    const preferredOffset = 10;

    const fitsRight = buttonRect.right + preferredOffset + tooltipRect.width + edgePadding <= viewportWidth;
    const left = fitsRight
      ? buttonRect.right + preferredOffset
      : Math.max(edgePadding, buttonRect.left - tooltipRect.width - preferredOffset);
    const centeredTop = buttonRect.top + (buttonRect.height / 2) - (tooltipRect.height / 2);
    const top = Math.min(
      Math.max(edgePadding, centeredTop),
      viewportHeight - tooltipRect.height - edgePadding,
    );

    setTooltipStyle({
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
    });
  }, [isTooltipVisible, shouldShowFloatingLabel]);

  const showFloatingLabel = shouldShowFloatingLabel && isTooltipVisible;

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={locked ? `${item.label} (Premium)` : item.label}
      aria-describedby={showFloatingLabel ? tooltipId : undefined}
      onClick={onClick}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
      className={`sidebar-nav-item group ${isOpen ? "is-open" : "is-collapsed"} ${active ? "is-active" : ""} ${compact ? "is-compact" : ""} ${locked ? "is-locked" : ""}`.trim()}
    >
      <span className="sidebar-nav-icon" aria-hidden>{item.icon}</span>
      <span className={`sidebar-nav-label ${isOpen ? "is-visible" : ""}`}>{item.label}</span>
      {locked ? <span className="sidebar-lock-indicator" aria-hidden>🔒</span> : null}
      {locked ? <span className="sidebar-lock-mask" aria-hidden /> : null}

      {shouldShowFloatingLabel ? (
        <span
          id={tooltipId}
          ref={tooltipRef}
          role="tooltip"
          aria-hidden={!showFloatingLabel}
          className={`sidebar-tooltip ${showFloatingLabel ? "is-visible" : ""}`}
          style={tooltipStyle || undefined}
        >
          {item.label}
        </span>
      ) : null}
    </button>
  );
}

function SidebarSection({ title, items, isOpen, currentRoute, onItemClick, lockedRoutes = [], onLockedItemClick }) {
  return (
    <section className="sidebar-section">
      <p className={`caption-text sidebar-section-title ${isOpen ? "is-visible" : ""}`}>{title}</p>
      <div className="sidebar-section-items">
        {items.map((item) => (
          <SidebarItem
            key={`${title}-${item.label}`}
            item={item}
            isOpen={isOpen}
            active={item.matchRoutes ? item.matchRoutes.includes(currentRoute) : currentRoute === item.route}
            onClick={() => {
              if (lockedRoutes.includes(item.route)) {
                onLockedItemClick?.(item);
                onItemClick?.();
                return;
              }
              navigateTo(item.route);
              onItemClick?.();
            }}
            locked={lockedRoutes.includes(item.route)}
          />
        ))}
      </div>
    </section>
  );
}

function Sidebar({ isSidebarOpen, isMobileOpen = false, onToggle, onCloseMobile, mobileSidebarId }) {
  const currentRoute = getCurrentRoute().route;
  const currentUser = useAuthStore((state) => state.currentUser);
  const logout = useAuthStore((state) => state.logout);
  const [showPremiumLockModal, setShowPremiumLockModal] = useState(false);
  const sidebarWidth = useMemo(
    () => (isSidebarOpen ? "sidebar-desktop-expanded" : "sidebar-desktop-collapsed"),
    [isSidebarOpen],
  );

  const resolvedSections = useMemo(
    () => sections.map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.route !== ROUTES.PROFILE) return item;
        return { ...item, route: getUserProfileRoute(currentUser?.username) };
      }),
    })),
    [currentUser?.username],
  );
  const premiumAccess = useMemo(() => getPremiumAccess(currentUser), [currentUser]);
  const lockedRoutes = useMemo(
    () => (premiumAccess.premiumActive ? [] : [ROUTES.ALARMS, ROUTES.LEARNING_INSIGHTS]),
    [premiumAccess.premiumActive],
  );

  return (
    <>
      <ConfirmationModal
        isOpen={showPremiumLockModal}
        title="Premium feature"
        message="Reminders and Insights are Premium features. Upgrade to Premium to unlock faster learning tools."
        onClose={() => setShowPremiumLockModal(false)}
        actions={[
          {
            key: "continue-free",
            label: "Continue free",
            variant: "subtle",
            onClick: () => setShowPremiumLockModal(false),
            className: "sidebar-modal-action-free",
          },
          {
            key: "buy-premium",
            label: "Buy Premium",
            variant: "success",
            onClick: () => {
              setShowPremiumLockModal(false);
              navigateTo(ROUTES.PREMIUM);
            },
            className: "sidebar-modal-action-premium",
          },
        ]}
      />
      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 bg-[var(--overlay-backdrop)] lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      ) : null}

      <aside className={`sidebar-desktop ${sidebarWidth}`}>
        <div className="sidebar-desktop-header">
          <button
            type="button"
            onClick={onToggle}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="sidebar-toggle"
          >
            <span className={`transition-transform duration-200 ${isSidebarOpen ? "rotate-180" : ""}`}>❮</span>
          </button>
          <div className={`sidebar-brand ${isSidebarOpen ? "is-visible" : ""}`}>
            <p className="eyebrow">IQMS</p>
            <p className="meta-text">Create Sheets</p>
          </div>
        </div>

        <nav className="sidebar-scroll" aria-label="Primary">
          {resolvedSections.map((section) => (
            <SidebarSection
              key={section.title}
              title={section.title}
              items={section.items}
              isOpen={isSidebarOpen}
              currentRoute={currentRoute}
              lockedRoutes={lockedRoutes}
              onLockedItemClick={() => setShowPremiumLockModal(true)}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          {currentUser ? (
            <>
              <SidebarItem item={{ label: "Edit Profile", icon: "✎" }} isOpen={isSidebarOpen} active={currentRoute === ROUTES.EDIT_PROFILE} onClick={() => navigateTo(ROUTES.EDIT_PROFILE)} />
              <SidebarItem
                item={{ label: "Log Out", icon: "↗" }}
                isOpen={isSidebarOpen}
                active={false}
                onClick={() => {
                  logout();
                  navigateTo(ROUTES.LOGIN);
                }}
              />
            </>
          ) : (
            <SidebarItem item={{ label: "Login", icon: "→" }} isOpen={isSidebarOpen} active={currentRoute === ROUTES.LOGIN} onClick={() => navigateTo(ROUTES.LOGIN)} />
          )}
        </div>
      </aside>

      <aside
        id={mobileSidebarId}
        aria-hidden={!isMobileOpen}
        className={`sidebar-mobile lg:hidden ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="sidebar-desktop-header">
          <div className="sidebar-brand is-visible">
            <p className="eyebrow">IQMS</p>
            <p className="meta-text">Create Sheets</p>
          </div>
          <button type="button" onClick={onCloseMobile} aria-label="Close navigation" className="sidebar-toggle">✕</button>
        </div>

        <nav className="sidebar-scroll" aria-label="Mobile primary">
          {resolvedSections.map((section) => (
            <SidebarSection
              key={`mobile-${section.title}`}
              title={section.title}
              items={section.items}
              isOpen
              currentRoute={currentRoute}
              onItemClick={onCloseMobile}
              lockedRoutes={lockedRoutes}
              onLockedItemClick={() => setShowPremiumLockModal(true)}
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          {currentUser ? (
            <>
              <SidebarItem item={{ label: "Edit Profile", icon: "✎" }} isOpen showTooltip={false} active={currentRoute === ROUTES.EDIT_PROFILE} onClick={() => { navigateTo(ROUTES.EDIT_PROFILE); onCloseMobile?.(); }} />
              <SidebarItem
                item={{ label: "Log Out", icon: "↗" }}
                isOpen
                showTooltip={false}
                active={false}
                onClick={() => {
                  logout();
                  navigateTo(ROUTES.LOGIN);
                  onCloseMobile?.();
                }}
              />
            </>
          ) : (
            <SidebarItem item={{ label: "Login", icon: "→" }} isOpen showTooltip={false} active={currentRoute === ROUTES.LOGIN} onClick={() => { navigateTo(ROUTES.LOGIN); onCloseMobile?.(); }} />
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
