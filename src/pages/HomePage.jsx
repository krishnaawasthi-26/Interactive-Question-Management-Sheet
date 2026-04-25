import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import SeoMeta from "../components/SeoMeta";
import EmptyState from "../components/ui/EmptyState";
import ProgressBar from "../components/ui/ProgressBar";
import SectionHeader from "../components/ui/SectionHeader";
import SurfaceCard from "../components/ui/SurfaceCard";
import { famousDsaSheets } from "../data/famousSheets";
import { fetchNotifications } from "../api/notificationApi";
import { navigateTo, ROUTES } from "../services/routes";
import { calculateSheetProgress } from "../services/progress";
import { useAuthStore } from "../store/authStore";
import { useSheetStore } from "../store/sheetStore";
import { buildCanonicalUrl, seoDefaults } from "../config/seo";

function HomePage({ theme, onThemeChange }) {
  const [copyingSheetId, setCopyingSheetId] = useState(null);
  const [notificationPreview, setNotificationPreview] = useState({ dueRevisions: [], upcomingAlarms: [] });
  const currentUser = useAuthStore((state) => state.currentUser);
  const sheets = useSheetStore((state) => state.sheets);
  const loadSheets = useSheetStore((state) => state.loadSheets);
  const duplicateSheet = useSheetStore((state) => state.duplicateSheet);
  const homepageSchemas = useMemo(() => ([
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: seoDefaults.siteName,
      url: seoDefaults.siteUrl,
      description: seoDefaults.defaultDescription,
      potentialAction: {
        "@type": "SearchAction",
        target: `${seoDefaults.siteUrl}/public-sheets`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Create Sheets",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: seoDefaults.siteUrl,
      description:
        "Create Sheets is a full-stack web app to create DSA sheets, coding practice trackers, revision plans, and interview preparation workflows.",
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Create Sheets",
      url: seoDefaults.siteUrl,
      logo: `${seoDefaults.siteUrl}/vite.svg`,
    },
  ]), []);

  useEffect(() => {
    if (!currentUser?.token) return;
    loadSheets(currentUser.token);
    Promise.all([
      fetchNotifications(currentUser.token, { type: "revision", status: "due", size: 3 }),
      fetchNotifications(currentUser.token, { type: "alarm", status: "upcoming", size: 3 }),
    ]).then(([dueRevisions, upcomingAlarms]) => {
      setNotificationPreview({
        dueRevisions: Array.isArray(dueRevisions) ? dueRevisions : [],
        upcomingAlarms: Array.isArray(upcomingAlarms) ? upcomingAlarms : [],
      });
    }).catch(() => undefined);
  }, [currentUser?.token, loadSheets]);

  const recentSheets = useMemo(() => [...sheets]
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
    .slice(0, 8), [sheets]);

  const copyFamousSheet = async (sheet) => {
    if (!currentUser?.token) {
      navigateTo(ROUTES.LOGIN);
      return;
    }

    setCopyingSheetId(sheet.id);
    try {
      const created = await duplicateSheet(currentUser.token, sheet, `${sheet.title} (Copy)`);
      if (created?.id) {
        navigateTo(`${ROUTES.APP}/${created.id}`);
      }
    } finally {
      setCopyingSheetId(null);
    }
  };

  return (
    <AppShell
      title="Create and Track DSA Sheets Online"
      subtitle="Build custom sheets for coding practice, revision, interview preparation, and collaborative learning."
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Guest"}
    >
      <SeoMeta
        title="Create Sheets | Create, Share & Track DSA Sheets"
        description="Create custom DSA sheets, coding practice trackers, and study lists. Share public sheets, copy curated templates, and track interview preparation progress in one place."
        path="/home"
        keywords={["create DSA sheet", "coding practice tracker", "interview preparation sheets", "public sheets"]}
        structuredData={homepageSchemas}
      />
      <div className="space-y-5">
        <SurfaceCard elevated className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent-primary)_8%,transparent),transparent_45%)]">
          <SectionHeader
            eyebrow="Dashboard"
            title="Welcome back"
            subtitle={currentUser?.token ? "Continue active practice sessions or copy a curated sheet." : "Log in to sync sheets, track progress, and manage your prep."}
          />
        </SurfaceCard>

        <div className="grid gap-4 xl:grid-cols-2">
          <SurfaceCard title="Due revisions" description="Items that need revision now.">
            {notificationPreview.dueRevisions.length === 0 ? <p className="meta-text">No due revisions right now.</p> : <div className="space-y-2">{notificationPreview.dueRevisions.map((item) => <button key={item.id} type="button" className="surface-card surface-card-elevated w-full text-left" onClick={() => navigateTo(item.actionUrl || ROUTES.NOTIFICATIONS)}><p className="card-title line-clamp-1">{item.title}</p><p className="meta-text">{item.message}</p></button>)}</div>}
          </SurfaceCard>
          <SurfaceCard title="Upcoming reminders" description="Next alarms and productivity reminders.">
            {notificationPreview.upcomingAlarms.length === 0 ? <p className="meta-text">No upcoming reminders.</p> : <div className="space-y-2">{notificationPreview.upcomingAlarms.map((item) => <button key={item.id} type="button" className="surface-card surface-card-elevated w-full text-left" onClick={() => navigateTo(ROUTES.ALARMS)}><p className="card-title line-clamp-1">{item.title}</p><p className="meta-text">{new Date(item.scheduledFor).toLocaleString()}</p></button>)}</div>}
          </SurfaceCard>
        </div>

        <SurfaceCard title="Recent Sheets" description="Quick access to your latest updated sheets.">
          {!currentUser?.token ? (
            <EmptyState
              title="Sign in to view recent sheets"
              description="Recent activity and progress are available after login."
              icon="🔐"
              action={<button className="btn-base btn-primary" type="button" onClick={() => navigateTo(ROUTES.LOGIN)}>Go to Login</button>}
            />
          ) : recentSheets.length === 0 ? (
            <EmptyState title="No recent sheets yet" description="Create or copy a sheet to start building your prep workflow." icon="📄" />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recentSheets.map((sheet) => {
                const progress = calculateSheetProgress(sheet);
                return (
                  <button
                    key={sheet.id}
                    type="button"
                    className="surface-card surface-card-elevated text-left transition hover:-translate-y-0.5"
                    onClick={() => navigateTo(`${ROUTES.APP}/${sheet.id}`)}
                  >
                    <p className="card-title line-clamp-1">{sheet.title || "Untitled Sheet"}</p>
                    <p className="meta-text mt-1">Updated {sheet.updatedAt ? new Date(sheet.updatedAt).toLocaleString() : "Unknown"}</p>
                    <p className="meta-text mt-2">{progress.completedQuestions}/{progress.totalQuestions} solved · {progress.percent}%</p>
                    <div className="mt-2"><ProgressBar percent={progress.percent} /></div>
                  </button>
                );
              })}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="Famous Sheets" description="Curated sheet templates from app data.">
          <div className="grid gap-3 lg:grid-cols-2">
            {famousDsaSheets.map((sheet) => (
              <article key={sheet.id} className="surface-card surface-card-elevated">
                <h3 className="card-title">{sheet.title}</h3>
                <p className="meta-text mt-1">{sheet.description}</p>
                <button
                  type="button"
                  className="btn-base btn-neutral mt-3"
                  onClick={() => copyFamousSheet(sheet)}
                  disabled={copyingSheetId === sheet.id}
                >
                  {copyingSheetId === sheet.id ? "Copying..." : "Copy to My Sheets"}
                </button>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <section className="surface-card space-y-4 p-5">
          <h2 className="section-title">Build custom coding, study, and revision sheets in minutes</h2>
          <p className="meta-text">
            Create Sheets is a sheet management website where you can create DSA sheets, programming sheets, and topic-based trackers for interviews, classes, and daily problem solving.
            Use your own structure, mix platforms like LeetCode and GFG, and manage everything from one dashboard.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <article>
              <h3 className="card-title">Create DSA practice sheets</h3>
              <p className="meta-text">Group topics by arrays, graphs, dynamic programming, and company-focused interview sets.</p>
            </article>
            <article>
              <h3 className="card-title">Share and copy public sheets</h3>
              <p className="meta-text">Publish useful lists, discover curated public sheets, and copy them into your own workspace for personalized practice.</p>
            </article>
            <article>
              <h3 className="card-title">Track progress and revisions</h3>
              <p className="meta-text">Measure completion with progress bars, revision reminders, and quick resume actions that keep your prep consistent.</p>
            </article>
          </div>
          <p className="meta-text">
            Whether you are preparing for coding interviews, competitive programming contests, or semester exams, Create Sheets helps you stay organized and accountable.
            Explore more at <a className="link-base" href={buildCanonicalUrl("/public-sheets")}>Public Sheets</a>.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

export default HomePage;
