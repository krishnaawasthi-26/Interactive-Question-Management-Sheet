import AppSidebar from "./AppSidebar";
import TopHeader from "./TopHeader";

function AppShell({
  title,
  subtitle,
  theme,
  onThemeChange,
  userLabel,
  headerActions,
  rightPanel,
  children,
  contentClassName = "",
}) {
  return (
    <div className="app-shell text-[var(--text-primary)]">
      <AppSidebar />
      <div className="app-content">
        <TopHeader
          title={title}
          subtitle={subtitle}
          theme={theme}
          onThemeChange={onThemeChange}
          userLabel={userLabel}
          actions={headerActions}
        />

        <div className={`grid gap-6 ${rightPanel ? "xl:grid-cols-[minmax(0,1fr)_280px]" : ""}`}>
          <main className={contentClassName}>{children}</main>
          {rightPanel ? <aside className="xl:sticky xl:top-6 xl:h-fit">{rightPanel}</aside> : null}
        </div>
      </div>
    </div>
  );
}

export default AppShell;
