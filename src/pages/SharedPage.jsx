import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopicList from "../components/TopicList";
import SeoMeta from "../components/SeoMeta";
import {
  fetchPublicProfile,
  fetchViewerPublicProfile,
  fetchPublicSheet,
  fetchSharedProfile,
  followUser,
  unfollowUser,
} from "../api/profileApi";
import { copyPublicSheet, getSharedSheet, trackSheetEngagement } from "../api/sheetApi";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import { navigateTo, ROUTES, slugifySegment } from "../services/routes";
import { exportSheetAsJson } from "../services/sheetExport";
import AppShell from "../components/AppShell";
import { seoDefaults } from "../config/seo";
import PremiumLotusBadge from "../components/PremiumLotusBadge";

function SharedPage({ shareType: shareTypeProp, shareId: shareIdProp, username: usernameProp, sheetSlug: sheetSlugProp, theme, onThemeChange }) {
  const { shareType: shareTypeFromRoute, shareId: shareIdFromRoute, username: usernameFromRoute, sheetSlug: sheetSlugFromRoute } = useParams();
  const shareType = shareTypeProp ?? shareTypeFromRoute;
  const shareId = shareIdProp ?? shareIdFromRoute;
  const username = usernameProp ?? usernameFromRoute;
  const sheetSlug = sheetSlugProp ?? sheetSlugFromRoute;
  const [profile, setProfile] = useState(null);
  const [sharedSheet, setSharedSheet] = useState(null);
  const [error, setError] = useState(null);
  const [engagementViewer, setEngagementViewer] = useState(null);
  const [followPending, setFollowPending] = useState(false);
  const [showRemixModal, setShowRemixModal] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("Sheets");
  const [remixTitle, setRemixTitle] = useState("");
  const [keepAttribution, setKeepAttribution] = useState(true);
  const [copyPending, setCopyPending] = useState(false);
  const [copyPromptOpen, setCopyPromptOpen] = useState(false);

  const currentUser = useAuthStore((state) => state.currentUser);
  const sheetTitle = useSheetStore((state) => state.sheetTitle);
  const setReadOnlySheet = useSheetStore((state) => state.setReadOnlySheet);

  const loadProfileForRoute = async (targetUsername) => {
    if (!targetUsername) return null;
    if (currentUser?.token) {
      try {
        return await fetchViewerPublicProfile(currentUser.token, targetUsername);
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          return fetchPublicProfile(targetUsername);
        }
        throw error;
      }
    }
    return fetchPublicProfile(targetUsername);
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (shareType === "profile") {
          const data = await fetchSharedProfile(shareId);
          setProfile(data);
          return;
        }

        if (shareType === "public-profile") {
          const data = await loadProfileForRoute(username);
          setProfile(data);
          return;
        }

        if (shareType === "public-sheet") {
          const sheet = await fetchPublicSheet(username, sheetSlug);
          setSharedSheet(sheet);
          setReadOnlySheet(sheet);
          try {
            const ownerProfile = await loadProfileForRoute(username);
            setProfile(ownerProfile);
          } catch {
            setProfile(null);
          }
          return;
        }

        const sheet = await getSharedSheet(shareId);
        setSharedSheet(sheet);
        setReadOnlySheet(sheet);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, [currentUser?.token, setReadOnlySheet, shareId, shareType, sheetSlug, username]);

  useEffect(() => {
    if (!showRemixModal) return;
    setRemixTitle(sharedSheet?.title ? `${sharedSheet.title} (Copy)` : "");
  }, [showRemixModal, sharedSheet]);

  useEffect(() => {
    if (shareType !== "public-sheet" || !sharedSheet?.id || !currentUser?.username || !username) return;
    if (`${currentUser.username}`.toLowerCase() !== `${username}`.toLowerCase()) return;
    navigateTo(`${ROUTES.APP}/${sharedSheet.id}`);
  }, [currentUser?.username, shareType, sharedSheet?.id, username]);

  const isOwnerViewingSheet = Boolean(
    sharedSheet &&
    currentUser &&
    (sharedSheet.ownerId === currentUser.id
      || `${currentUser.username || ""}`.toLowerCase() === `${username || ""}`.toLowerCase())
  );

  const profileTitle = `${profile?.username || username || "User"}'s Public Sheets | Create Sheets`;
  const profileDescription = `Explore public DSA, coding, study, and revision sheets created by ${profile?.username || username || "this user"} on Create Sheets.`;
  const publicSheetTitle = `${sharedSheet?.title || sheetSlug || "Public Sheet"} | Public DSA Sheet on Create Sheets`;
  const publicSheetDescription = `Practice problems from ${sharedSheet?.title || "this sheet"}, a public coding and DSA sheet created on Create Sheets. Copy, track, and manage your own progress.`;
  const canonicalPath = shareType === "public-sheet"
    ? `/profile/${username || sharedSheet?.ownerUsername || "user"}/${sheetSlug || slugifySegment(sharedSheet?.title || "sheet")}`
    : `/profile/${username || profile?.username || "user"}`;
  const activeTitle = shareType === "public-sheet" ? publicSheetTitle : profileTitle;
  const activeDescription = shareType === "public-sheet" ? publicSheetDescription : profileDescription;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${seoDefaults.siteUrl}/home` },
      { "@type": "ListItem", position: 2, name: "Public Sheets", item: `${seoDefaults.siteUrl}/public-sheets` },
      { "@type": "ListItem", position: 3, name: shareType === "public-sheet" ? (sharedSheet?.title || "Sheet") : (profile?.username || username || "Profile"), item: `${seoDefaults.siteUrl}${canonicalPath}` },
    ],
  };
  const pageSchema = shareType === "public-sheet"
    ? {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: sharedSheet?.title || "Public Sheet",
      description: activeDescription,
      url: `${seoDefaults.siteUrl}${canonicalPath}`,
    }
    : {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: profile?.name || profile?.username || username || "Create Sheets User",
      url: `${seoDefaults.siteUrl}${canonicalPath}`,
      description: activeDescription,
    };

  const resolveSourceSheetId = async ({ sourceSheetId, sourceShareId } = {}) => {
    if (sourceSheetId) return sourceSheetId;
    if (sharedSheet?.id) return sharedSheet.id;
    if (!sourceShareId) return null;

    const resolvedSharedSheet = await getSharedSheet(sourceShareId);
    return resolvedSharedSheet?.id || null;
  };

  const handleCopySheet = async ({ sourceSheetId, sourceShareId, customTitle = null } = {}) => {
    if (!currentUser?.token) return;

    const effectiveSourceSheetId = await resolveSourceSheetId({ sourceSheetId, sourceShareId });
    if (!effectiveSourceSheetId) return;

    setCopyPending(true);
    try {
      const copied = await copyPublicSheet(currentUser.token, effectiveSourceSheetId, customTitle || undefined);
      if (!copied?.id) return;
      setShowRemixModal(false);
      setCopyPromptOpen(false);
      navigateTo(`${ROUTES.APP}/${copied.id}`);
    } finally {
      setCopyPending(false);
    }
  };

  if (error) return <div className="p-6 text-[var(--accent-danger)]">{error}</div>;

  if (shareType === "profile" || shareType === "public-profile") {
    const totalDownloadCount = (profile?.sheets || []).reduce(
      (sum, sheet) => sum + (sheet.downloadedByUsernames?.length || 0),
      0
    );
    const totalCopyCount = (profile?.sheets || []).reduce(
      (sum, sheet) => sum + (sheet.copiedByUsernames?.length || 0),
      0
    );
    const allDownloadedUsers = (profile?.sheets || []).flatMap((sheet) =>
      (sheet.downloadedByUsernames || []).map((usernameEntry) => ({
        username: usernameEntry,
        sheetTitle: sheet.title,
      }))
    );
    const allCopiedUsers = (profile?.sheets || []).flatMap((sheet) =>
      (sheet.copiedByUsernames || []).map((usernameEntry) => ({
        username: usernameEntry,
        sheetTitle: sheet.title,
      }))
    );
    const profileLinks = [
      { label: "Website", href: profile?.websiteUrl },
      { label: "GitHub", href: profile?.githubUrl },
      { label: "LinkedIn", href: profile?.linkedinUrl },
      { label: "Resume", href: profile?.resumeUrl },
    ].filter((item) => item.href);
    const isOwnProfile = Boolean(profile?.viewerIsOwner) || currentUser?.username === profile?.username;
    const followers = profile?.followers || [];
    const following = profile?.following || [];
    const isFollowingProfile = typeof profile?.viewerFollowsProfile === "boolean"
      ? profile.viewerFollowsProfile
      : followers.some((entry) => entry.username === currentUser?.username);
    const profileFollowsViewer = Boolean(profile?.profileFollowsViewer);
    const publicSheets = profile?.sheets || [];
    const profileName = profile?.name || profile?.username || "Create Sheets user";
    const recentSheets = [...publicSheets]
      .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
      .slice(0, 3);

    const downloadedActivity = allDownloadedUsers.map((entry, index) => ({
      id: `download-${entry.username}-${entry.sheetTitle}-${index}`,
      text: `@${entry.username} downloaded "${entry.sheetTitle}"`,
    }));
    const copiedActivity = allCopiedUsers.map((entry, index) => ({
      id: `copy-${entry.username}-${entry.sheetTitle}-${index}`,
      text: `@${entry.username} copied "${entry.sheetTitle}"`,
    }));
    const activityFeed = [...downloadedActivity, ...copiedActivity].slice(0, 20);

    const tabs = ["Sheets", "Activity", "Portfolio", "Stats"];
    const cardClassName = "surface-card p-5";
    const elevatedCardClassName = "surface-card surface-card-elevated p-4";
    const statPillClassName = "btn-base btn-neutral w-full px-3 py-2 text-left text-sm";
    const tabButtonBaseClassName = "btn-base rounded-lg px-4 py-2 text-sm font-medium";
    const linkButtonClassName = "btn-base btn-neutral rounded-lg px-3 py-1 text-sm";

    return (
      <AppShell title={`@${profile?.username || "profile"}`} subtitle="Public profile view" theme={theme} onThemeChange={onThemeChange} userLabel={currentUser?.username || "Guest"}>
        <SeoMeta
          title={activeTitle}
          description={activeDescription}
          path={canonicalPath}
          type="profile"
          keywords={["public sheets", "DSA sheets", "coding sheets", "revision sheets"]}
          structuredData={[breadcrumbSchema, pageSchema]}
        />
        <div className="mx-auto max-w-6xl space-y-5 text-[var(--text-primary)]">
          <section className={cardClassName}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--accent-info)_16%,var(--surface-elevated))] text-xl font-semibold text-[color-mix(in_srgb,var(--accent-info)_62%,white)]">
                    {profileName
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <PremiumLotusBadge
                    active={Boolean(profile?.premiumActive)}
                    size="avatar"
                    className="absolute -bottom-1 -right-1"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
                    <span>{profileName}</span>
                    <PremiumLotusBadge active={Boolean(profile?.premiumActive)} size="sm" />
                  </h2>
                  <p className="meta-text mt-1">@{profile?.username || "unknown"}</p>
                  {(profile?.institution || profile?.company) && (
                    <p className="meta-text mt-1">{[profile?.institution, profile?.company].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
              </div>
              {currentUser?.token && !isOwnProfile && (
                <div className="flex flex-col items-end gap-2">
                  {profileFollowsViewer && <span className="meta-text text-xs">Follows you</span>}
                  <button
                    className="btn-base btn-primary min-w-28"
                    type="button"
                    disabled={followPending}
                    onClick={async () => {
                      if (!profile?.username) return;
                      setFollowPending(true);
                      try {
                        if (isFollowingProfile) {
                          await unfollowUser(currentUser.token, profile.username);
                        } else {
                          await followUser(currentUser.token, profile.username);
                        }
                        const refreshed = await loadProfileForRoute(profile.username);
                        setProfile(refreshed);
                      } finally {
                        setFollowPending(false);
                      }
                    }}
                  >
                    {followPending ? "Loading..." : isFollowingProfile ? "Unfollow" : "Follow"}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <button
                className={statPillClassName}
                type="button"
                onClick={() =>
                  setEngagementViewer({
                    title: `Followers of @${profile?.username}`,
                    users: followers.map((entry) => ({ ...entry, sheetTitle: "" })),
                  })
                }
              >
                Followers: {profile?.followersCount ?? followers.length}
              </button>
              <button
                className={statPillClassName}
                type="button"
                onClick={() =>
                  setEngagementViewer({
                    title: `Following by @${profile?.username}`,
                    users: following.map((entry) => ({ ...entry, sheetTitle: "" })),
                  })
                }
              >
                Following: {profile?.followingCount ?? following.length}
              </button>
              <button
                className={statPillClassName}
                type="button"
                onClick={() => setEngagementViewer({ title: "Downloaded by", users: allDownloadedUsers })}
              >
                Downloads: {totalDownloadCount}
              </button>
              <button
                className={statPillClassName}
                type="button"
                onClick={() => setEngagementViewer({ title: "Copied by", users: allCopiedUsers })}
              >
                Copies: {totalCopyCount}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${tabButtonBaseClassName} ${
                    tab === activeProfileTab ? "btn-primary" : "btn-ghost text-[var(--text-secondary)]"
                  }`}
                  onClick={() => setActiveProfileTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>

          {activeProfileTab === "Sheets" && (
            <section className="grid gap-5 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-5">
                <div className={cardClassName}>
                  <h2 className="section-title text-lg">Recently updated sheets</h2>
                  {recentSheets.length === 0 ? (
                    <p className="meta-text mt-3">No public sheets yet.</p>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {recentSheets.map((sheet) => (
                        <div key={sheet.id} className={elevatedCardClassName}>
                          <p className="card-title">{sheet.title}</p>
                          <p className="meta-text mt-1 text-xs">
                            {sheet.updatedAt ? new Date(sheet.updatedAt).toLocaleDateString() : "No update date"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={cardClassName}>
                  <h2 className="section-title text-lg">Public sheets</h2>
                  <div className="mt-4 space-y-2">
                    {publicSheets.length === 0 ? (
                      <p className="meta-text">No public sheets shared yet.</p>
                    ) : (
                      publicSheets.map((sheet) => (
                        <div className="surface-card surface-card-elevated flex items-center justify-between gap-3 p-3" key={sheet.id}>
                          <div className="flex items-center gap-3">
                            <a href={`${ROUTES.SHARED_PREFIX}/sheet/${sheet.shareId}`} className="card-title underline-offset-2 hover:underline">
                              {sheet.title}
                            </a>
                            {profile?.username && (
                              <a
                                href={`/profile/${profile.username}/${slugifySegment(sheet.title)}`}
                                className="text-sm text-[var(--text-secondary)] underline-offset-2 hover:text-[var(--accent-info)] hover:underline"
                              >
                                Open clean URL
                              </a>
                            )}
                          </div>
                          {currentUser?.token && !isOwnProfile ? (
                            <button
                              type="button"
                              className="btn-base btn-primary px-3 py-1.5 text-sm"
                              onClick={async () => {
                                await handleCopySheet({
                                  sourceSheetId: sheet.id,
                                  sourceShareId: sheet.shareId,
                                  customTitle: `${sheet.title || "Untitled Sheet"} (Copy)`,
                                });
                              }}
                            >
                              Copy Sheet
                            </button>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <aside>
                <div className={`${cardClassName} bg-[linear-gradient(145deg,color-mix(in_srgb,var(--accent-info)_12%,var(--surface-elevated)),color-mix(in_srgb,var(--surface)_90%,transparent))]`}>
                  <p className="meta-text text-sm">Profile overview</p>
                  <p className="section-title mt-2 text-lg">{profile?.totalSheets ?? publicSheets.length} public sheets</p>
                  <p className="meta-text mt-1">{totalDownloadCount} total downloads · {totalCopyCount} total copies</p>
                </div>
              </aside>
            </section>
          )}

          {activeProfileTab === "Activity" && (
            <section className={cardClassName}>
              <h2 className="section-title text-lg">Recent activity</h2>
              {activityFeed.length === 0 ? (
                <p className="meta-text mt-3">No public engagement recorded yet.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                  {activityFeed.map((activity) => (
                    <li key={activity.id} className={elevatedCardClassName}>
                      {activity.text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeProfileTab === "Portfolio" && (
            <section className={cardClassName}>
              <h2 className="caption-text text-sm">Bio</h2>
              {profile?.bio ? <p className="meta-text mt-2 whitespace-pre-wrap text-sm">{profile.bio}</p> : <p className="meta-text mt-2 text-sm">No bio shared yet.</p>}
              {(profile?.institution || profile?.company) && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {profile?.institution && (
                    <div className={elevatedCardClassName}>
                      <p className="caption-text text-xs">Institution</p>
                      <p className="meta-text text-sm text-[var(--text-primary)]">{profile.institution}</p>
                    </div>
                  )}
                  {profile?.company && (
                    <div className={elevatedCardClassName}>
                      <p className="caption-text text-xs">Company</p>
                      <p className="meta-text text-sm text-[var(--text-primary)]">{profile.company}</p>
                    </div>
                  )}
                </div>
              )}
              {profileLinks.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {profileLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className={linkButtonClassName}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeProfileTab === "Stats" && (
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Public Sheets", value: profile?.totalSheets ?? publicSheets.length },
                { label: "Followers", value: profile?.followersCount ?? followers.length },
                { label: "Downloads", value: totalDownloadCount },
                { label: "Copies", value: totalCopyCount },
              ].map((stat) => (
                <div key={stat.label} className={cardClassName}>
                  <p className="caption-text text-xs">{stat.label}</p>
                  <p className="section-title mt-2 text-2xl">{stat.value}</p>
                </div>
              ))}
            </section>
          )}
        </div>
        {engagementViewer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4">
            <div className="surface-card w-full max-w-lg rounded-xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{engagementViewer.title}</h3>
                <button
                  type="button"
                  className="btn-base btn-neutral btn-sm rounded px-2 py-1 text-xs"
                  onClick={() => setEngagementViewer(null)}
                >
                  Close
                </button>
              </div>
              {engagementViewer.users.length === 0 ? (
                <p className="meta-text text-sm">No users yet.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-auto">
                  {engagementViewer.users.map((entry, index) => (
                    <div
                      key={`${entry.username}-${entry.sheetTitle}-${index}`}
                      className="rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)]/55 p-2 text-sm"
                    >
                      <p className="font-medium inline-flex items-center gap-2">
                        <span>@{entry.username}</span>
                        <PremiumLotusBadge active={Boolean(entry?.premiumActive)} size="sm" />
                      </p>
                      {entry.sheetTitle ? (
                        <p className="meta-text text-xs">Sheet: {entry.sheetTitle || "Untitled Sheet"}</p>
                      ) : (
                        <p className="meta-text text-xs">{entry.name ? entry.name : "Create Sheets user"}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell
      title={sharedSheet?.title || sheetTitle}
      subtitle={isOwnerViewingSheet ? "Owner view" : "Public read-only view"}
      theme={theme}
      onThemeChange={onThemeChange}
      userLabel={currentUser?.username || "Guest"}
      headerActions={(
        <div className="flex items-center gap-2">
          {!isOwnerViewingSheet && <span className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-secondary)]">Read only</span>}
          {currentUser?.token && sharedSheet && (
            <button
              type="button"
              className="btn-base btn-neutral px-3 py-1.5 text-sm"
              onClick={async () => {
                try {
                  await trackSheetEngagement(currentUser.token, sharedSheet.id, "download");
                } catch {
                  // no-op; download should not be blocked
                }
                exportSheetAsJson({ sheetTitle: sharedSheet.title, topics: sharedSheet.topics || [] });
              }}
            >
              Download JSON
            </button>
          )}
          {currentUser?.token && sharedSheet && !isOwnerViewingSheet && (
            <button type="button" className="btn-base btn-primary px-3 py-1.5 text-sm" onClick={() => setShowRemixModal(true)}>
              Copy Sheet
            </button>
          )}
        </div>
      )}
    >
      <SeoMeta
        title={activeTitle}
        description={activeDescription}
        path={canonicalPath}
        keywords={["public dsa sheet", "coding practice sheet", "interview preparation sheet"]}
        structuredData={[breadcrumbSchema, pageSchema]}
      />
      <TopicList
        isEditing={isOwnerViewingSheet}
        allowReorder={isOwnerViewingSheet}
        allowProgressToggle={isOwnerViewingSheet}
        showAttemptInsights={isOwnerViewingSheet}
        onRequireCopy={() => setCopyPromptOpen(true)}
      />
      {!isOwnerViewingSheet && username && (
        <div className="mx-auto mt-4 w-full max-w-3xl">
          <div className="surface-card surface-card-elevated flex items-center justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="caption-text text-xs">Sheet owner</p>
              <p className="card-title inline-flex items-center gap-2">
                <span>@{profile?.username || username}</span>
                <PremiumLotusBadge active={Boolean(profile?.premiumActive)} size="sm" />
              </p>
            </div>
            <a href={`/profile/${profile?.username || username}`} className="btn-base btn-neutral px-3 py-1.5 text-sm">
              View profile
            </a>
          </div>
        </div>
      )}
      {showRemixModal && !isOwnerViewingSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4 backdrop-blur-sm">
          <div className="surface-card w-full max-w-xl rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="section-title text-xl font-semibold">Remix Sheet</h2>
              <button
                type="button"
                className="btn-base btn-neutral btn-sm rounded-md px-2 py-1"
                onClick={() => setShowRemixModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="border-t border-[var(--border-subtle)]" />
            <div className="space-y-5 px-6 py-5 text-[var(--text-primary)]">
              <label className="block text-sm font-medium" htmlFor="remix-title-input">
                New Title:
              </label>
              <input
                id="remix-title-input"
                className="field-base w-full rounded-md px-3 py-2 text-sm"
                value={remixTitle}
                onChange={(event) => setRemixTitle(event.target.value)}
              />
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={keepAttribution}
                    onChange={(event) => setKeepAttribution(event.target.checked)}
                  />
                  Keep Original Creator Attribution
                </label>
              </div>
            </div>
            <div className="border-t border-[var(--border-subtle)]" />
            <div className="flex justify-end px-6 py-4">
              <button
                type="button"
                className="btn-base btn-primary rounded-md px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed"
                disabled={copyPending}
                onClick={async () => {
                  if (!currentUser?.token || !sharedSheet) return;
                  const computedTitle = remixTitle.trim() || `${sharedSheet.title || "Untitled Sheet"} (Copy)`;
                  await handleCopySheet({
                    customTitle: `${computedTitle}${keepAttribution && username ? ` (Remix of @${username})` : ""}`,
                  });
                }}
              >
                {copyPending ? "Creating..." : "Create Remix"}
              </button>
            </div>
          </div>
        </div>
      )}
      {copyPromptOpen && !isOwnerViewingSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay-backdrop)] p-4">
          <div className="surface-card w-full max-w-md p-5">
            <h3 className="section-title text-lg">Copy this sheet to track your own progress.</h3>
            <p className="meta-text mt-2 text-sm">This public sheet is read-only. Create your own copy to mark questions complete.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-base btn-neutral px-3 py-2 text-sm" onClick={() => setCopyPromptOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-base btn-primary px-3 py-2 text-sm" disabled={copyPending} onClick={() => handleCopySheet()}>
                {copyPending ? "Copying..." : "Copy Sheet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default SharedPage;
