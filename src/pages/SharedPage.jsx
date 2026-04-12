import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TopicList from "../components/TopicList";
import {
  fetchPublicProfile,
  fetchViewerPublicProfile,
  fetchPublicSheet,
  fetchSharedProfile,
  followUser,
  unfollowUser,
} from "../api/profileApi";
import { getSharedSheet, trackSheetEngagement } from "../api/sheetApi";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import { navigateTo, ROUTES, slugifySegment } from "../services/routes";
import { exportSheetAsJson } from "../services/sheetExport";
import AppShell from "../components/AppShell";

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
  const [includeLinks, setIncludeLinks] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [keepAttribution, setKeepAttribution] = useState(true);
  const [copyPending, setCopyPending] = useState(false);

  const currentUser = useAuthStore((state) => state.currentUser);
  const sheetTitle = useSheetStore((state) => state.sheetTitle);
  const setReadOnlySheet = useSheetStore((state) => state.setReadOnlySheet);
  const duplicateSheet = useSheetStore((state) => state.duplicateSheet);

  const removeKeysRecursively = (value, disallowedKeys) => {
    if (Array.isArray(value)) {
      return value.map((entry) => removeKeysRecursively(entry, disallowedKeys));
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    return Object.entries(value).reduce((acc, [key, entry]) => {
      if (disallowedKeys.has(key)) return acc;
      acc[key] = removeKeysRecursively(entry, disallowedKeys);
      return acc;
    }, {});
  };

  const getRemixTopics = () => {
    const disallowedKeys = new Set();
    if (!includeLinks) {
      disallowedKeys.add("link");
      disallowedKeys.add("links");
      disallowedKeys.add("resource");
      disallowedKeys.add("resources");
      disallowedKeys.add("resourceUrl");
      disallowedKeys.add("resourceUrls");
      disallowedKeys.add("url");
      disallowedKeys.add("urls");
    }
    if (!includeNotes) {
      disallowedKeys.add("note");
      disallowedKeys.add("notes");
      disallowedKeys.add("personalNote");
      disallowedKeys.add("personalNotes");
      disallowedKeys.add("description");
    }

    if (disallowedKeys.size === 0) {
      return sharedSheet?.topics || [];
    }

    return removeKeysRecursively(sharedSheet?.topics || [], disallowedKeys);
  };

  const loadProfileForRoute = async (targetUsername) => {
    if (!targetUsername) return null;
    if (currentUser?.token) {
      return fetchViewerPublicProfile(currentUser.token, targetUsername);
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

  if (error) return <div className="p-6 text-red-300">{error}</div>;

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
        <div className="mx-auto max-w-6xl space-y-5 text-[var(--text-primary)]">
          <section className={cardClassName}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--accent-info)_16%,var(--surface-elevated))] text-xl font-semibold text-[color-mix(in_srgb,var(--accent-info)_62%,white)]">
                  {profileName
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{profileName}</h1>
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
                    tab === activeProfileTab ? "btn-primary text-white" : "btn-ghost text-[var(--text-secondary)]"
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
                          <a href={`#/shared/sheet/${sheet.shareId}`} className="card-title underline-offset-2 hover:underline">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{engagementViewer.title}</h3>
                <button
                  type="button"
                  className="rounded border border-gray-700 px-2 py-1 text-xs"
                  onClick={() => setEngagementViewer(null)}
                >
                  Close
                </button>
              </div>
              {engagementViewer.users.length === 0 ? (
                <p className="text-sm text-zinc-400">No users yet.</p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-auto">
                  {engagementViewer.users.map((entry, index) => (
                    <div
                      key={`${entry.username}-${entry.sheetTitle}-${index}`}
                      className="rounded border border-gray-700 p-2 text-sm"
                    >
                      <p className="font-medium">@{entry.username}</p>
                      {entry.sheetTitle ? (
                        <p className="text-xs text-zinc-400">Sheet: {entry.sheetTitle || "Untitled Sheet"}</p>
                      ) : (
                        <p className="text-xs text-zinc-400">{entry.name ? entry.name : "Create Sheets user"}</p>
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
    <div className="min-h-screen bg-[var(--app-bg)] p-6 text-[var(--text-primary)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{sheetTitle} (Read only)</h1>
        <div className="flex flex-wrap items-center gap-2">
          {currentUser?.token && sharedSheet && (
            <button
              type="button"
              className="rounded border border-emerald-600/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300"
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
          {currentUser?.token && sharedSheet && (
            <button
              type="button"
              className="rounded border border-amber-600/40 bg-amber-500/10 px-3 py-1 text-sm text-amber-300"
              onClick={() => setShowRemixModal(true)}
            >
              Copy to my sheets
            </button>
          )}
        </div>
      </div>
      <TopicList isEditing={false} allowProgressToggle={false} />
      {showRemixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">Remix Sheet</h2>
              <button
                type="button"
                className="rounded-md border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50"
                onClick={() => setShowRemixModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="border-t border-slate-200" />
            <div className="space-y-5 px-6 py-5 text-slate-800">
              <label className="block text-sm font-medium" htmlFor="remix-title-input">
                New Title:
              </label>
              <input
                id="remix-title-input"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none ring-0 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                value={remixTitle}
                onChange={(event) => setRemixTitle(event.target.value)}
              />
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={includeLinks} onChange={(event) => setIncludeLinks(event.target.checked)} />
                  Include Links &amp; Resources
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={includeNotes} onChange={(event) => setIncludeNotes(event.target.checked)} />
                  Include Personal Notes
                </label>
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
            <div className="border-t border-slate-200" />
            <div className="flex justify-end px-6 py-4">
              <button
                type="button"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={copyPending}
                onClick={async () => {
                  if (!currentUser?.token || !sharedSheet) return;
                  setCopyPending(true);
                  try {
                    try {
                      await trackSheetEngagement(currentUser.token, sharedSheet.id, "copy");
                    } catch {
                      // no-op; copy should not be blocked
                    }
                    const computedTitle = remixTitle.trim() || `${sharedSheet.title || "Untitled Sheet"} (Copy)`;
                    const copied = await duplicateSheet(
                      currentUser.token,
                      {
                        ...sharedSheet,
                        topics: getRemixTopics(),
                      },
                      `${computedTitle}${keepAttribution && username ? ` (Remix of @${username})` : ""}`
                    );
                    if (!copied) return;
                    setShowRemixModal(false);
                    navigateTo(`${ROUTES.APP}/${copied.id}`);
                  } finally {
                    setCopyPending(false);
                  }
                }}
              >
                {copyPending ? "Creating..." : "Create Remix"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SharedPage;
