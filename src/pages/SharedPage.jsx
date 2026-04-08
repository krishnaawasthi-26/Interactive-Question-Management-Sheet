import { useEffect, useState } from "react";
import TopicList from "../components/TopicList";
import {
  fetchPublicProfile,
  fetchPublicSheet,
  fetchSharedProfile,
  followUser,
  unfollowUser,
} from "../api/profileApi";
import { getSharedSheet, trackSheetEngagement } from "../api/sheetApi";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import { navigateTo, ROUTES, slugifySegment } from "../services/hashRouter";
import { exportSheetAsJson } from "../services/sheetExport";

function SharedPage({ shareType, shareId, username, sheetSlug }) {
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

  useEffect(() => {
    const load = async () => {
      try {
        if (shareType === "profile") {
          const data = await fetchSharedProfile(shareId);
          setProfile(data);
          return;
        }

        if (shareType === "public-profile") {
          const data = await fetchPublicProfile(username);
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
  }, [setReadOnlySheet, shareId, shareType, sheetSlug, username]);

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
    ].filter((item) => item.href);
    const isOwnProfile = currentUser?.username === profile?.username;
    const followers = profile?.followers || [];
    const following = profile?.following || [];
    const isFollowingProfile = followers.some((entry) => entry.username === currentUser?.username);
    const publicSheets = profile?.sheets || [];
    const profileName = profile?.name || profile?.username || "IQMS user";
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

    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 md:px-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-xl font-semibold text-sky-700">
                  {profileName
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">{profileName}</h1>
                  <p className="mt-1 text-sm text-slate-600">@{profile?.username || "unknown"}</p>
                  {(profile?.institution || profile?.company) && (
                    <p className="mt-1 text-sm text-slate-500">{[profile?.institution, profile?.company].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-slate-700 hover:border-sky-300 hover:bg-sky-50"
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
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-slate-700 hover:border-sky-300 hover:bg-sky-50"
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
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                type="button"
                onClick={() => setEngagementViewer({ title: "Downloaded by", users: allDownloadedUsers })}
              >
                Downloads: {totalDownloadCount}
              </button>
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-left text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                type="button"
                onClick={() => setEngagementViewer({ title: "Copied by", users: allCopiedUsers })}
              >
                Copies: {totalCopyCount}
              </button>
              {currentUser?.token && !isOwnProfile && (
                <button
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left text-blue-700 hover:bg-blue-100"
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
                      const refreshed = await fetchPublicProfile(profile.username);
                      setProfile(refreshed);
                    } finally {
                      setFollowPending(false);
                    }
                  }}
                >
                  {followPending ? "Saving..." : isFollowingProfile ? "Unfollow" : "Follow"}
                </button>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    tab === activeProfileTab ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
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
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Recently updated sheets</h2>
                  {recentSheets.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">No public sheets yet.</p>
                  ) : (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {recentSheets.map((sheet) => (
                        <div key={sheet.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="font-medium text-slate-800">{sheet.title}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {sheet.updatedAt ? new Date(sheet.updatedAt).toLocaleDateString() : "No update date"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-slate-900">Public sheets</h2>
                  <div className="mt-4 space-y-2">
                    {publicSheets.length === 0 ? (
                      <p className="text-sm text-slate-500">No public sheets shared yet.</p>
                    ) : (
                      publicSheets.map((sheet) => (
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3" key={sheet.id}>
                          <a href={`#/shared/sheet/${sheet.shareId}`} className="font-medium text-slate-800 underline-offset-2 hover:underline">
                            {sheet.title}
                          </a>
                          {profile?.username && (
                            <a
                              href={`/profile/${profile.username}/${slugifySegment(sheet.title)}`}
                              className="text-sm text-slate-500 underline-offset-2 hover:text-blue-600 hover:underline"
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
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-sky-100 p-5 shadow-sm">
                  <p className="text-sm text-slate-600">Profile overview</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{profile?.totalSheets ?? publicSheets.length} public sheets</p>
                  <p className="mt-1 text-sm text-slate-600">{totalDownloadCount} total downloads · {totalCopyCount} total copies</p>
                </div>
              </aside>
            </section>
          )}

          {activeProfileTab === "Activity" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
              {activityFeed.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No public engagement recorded yet.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {activityFeed.map((activity) => (
                    <li key={activity.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      {activity.text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeProfileTab === "Portfolio" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {profile?.bio ? <p className="whitespace-pre-wrap text-sm text-slate-700">{profile.bio}</p> : <p className="text-sm text-slate-500">No bio shared yet.</p>}
              {(profile?.institution || profile?.company) && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {profile?.institution && (
                    <div className="rounded-md border border-slate-200 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Institution</p>
                      <p className="text-slate-700">{profile.institution}</p>
                    </div>
                  )}
                  {profile?.company && (
                    <div className="rounded-md border border-slate-200 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Company</p>
                      <p className="text-slate-700">{profile.company}</p>
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
                      className="rounded-lg border border-slate-200 px-3 py-1 text-sm text-blue-700 hover:bg-blue-50"
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
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
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
                        <p className="text-xs text-zinc-400">{entry.name ? entry.name : "IQMS user"}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-6 text-white">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{sheetTitle} (Read only)</h1>
        <div className="flex flex-wrap items-center gap-2">
          {currentUser?.token && sharedSheet && (
            <button
              type="button"
              className="rounded border border-emerald-700 px-3 py-1 text-sm text-emerald-200"
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
              className="rounded border border-amber-700 px-3 py-1 text-sm text-amber-200"
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
