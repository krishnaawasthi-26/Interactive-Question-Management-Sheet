import { useEffect, useState } from "react";
import TopicList from "../components/TopicList";
import { fetchPublicProfile, fetchPublicSheet, fetchSharedProfile } from "../api/profileApi";
import { getSharedSheet } from "../api/sheetApi";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import { navigateTo, ROUTES, slugifySegment } from "../services/hashRouter";

function SharedPage({ shareType, shareId, username, sheetSlug }) {
  const [profile, setProfile] = useState(null);
  const [sharedSheet, setSharedSheet] = useState(null);
  const [error, setError] = useState(null);

  const currentUser = useAuthStore((state) => state.currentUser);
  const sheetTitle = useSheetStore((state) => state.sheetTitle);
  const setReadOnlySheet = useSheetStore((state) => state.setReadOnlySheet);
  const duplicateSheet = useSheetStore((state) => state.duplicateSheet);

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

  if (error) return <div className="p-6 text-red-300">{error}</div>;

  if (shareType === "profile" || shareType === "public-profile") {
    const profileLinks = [
      { label: "Website", href: profile?.websiteUrl },
      { label: "GitHub", href: profile?.githubUrl },
      { label: "LinkedIn", href: profile?.linkedinUrl },
    ].filter((item) => item.href);

    return (
      <div className="min-h-screen bg-zinc-900 p-6 text-white">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-xl border border-gray-800 bg-[rgba(255,255,255,0.03)] p-5">
            <h1 className="text-2xl font-semibold">{profile?.name}&apos;s profile</h1>
            <p className="mt-2 text-zinc-300">@{profile?.username}</p>
            <p className="mt-2 text-zinc-200">Total sheets: {profile?.totalSheets ?? profile?.sheets?.length ?? 0}</p>
            {profile?.bio && <p className="mt-4 whitespace-pre-wrap text-zinc-200">{profile.bio}</p>}

            {(profile?.institution || profile?.company) && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {profile?.institution && (
                  <div className="rounded-md border border-gray-700 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">Institution</p>
                    <p className="text-zinc-200">{profile.institution}</p>
                  </div>
                )}
                {profile?.company && (
                  <div className="rounded-md border border-gray-700 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">Company</p>
                    <p className="text-zinc-200">{profile.company}</p>
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
                    className="rounded border border-sky-700 px-3 py-1 text-sm text-sky-200 hover:bg-sky-900/30"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Sheets</h2>
          {profile?.sheets?.map((sheet) => (
            <div className="flex items-center justify-between rounded border border-gray-700 p-3" key={sheet.id}>
              <a href={`#/shared/sheet/${sheet.shareId}`} className="font-medium underline-offset-2 hover:underline">
                {sheet.title}
              </a>
              {profile?.username && (
                <a
                  href={`/profile/${profile.username}/${slugifySegment(sheet.title)}`}
                  className="text-sm text-zinc-300 underline-offset-2 hover:underline"
                >
                  Open clean URL
                </a>
              )}
            </div>
          ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-6 text-white">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{sheetTitle} (Read only)</h1>
        {currentUser?.token && sharedSheet && (
          <button
            type="button"
            className="rounded border border-amber-700 px-3 py-1 text-sm text-amber-200"
            onClick={async () => {
              const copied = await duplicateSheet(currentUser.token, sharedSheet);
              navigateTo(`${ROUTES.APP}/${copied.id}`);
            }}
          >
            Copy to my sheets
          </button>
        )}
      </div>
      <TopicList isEditing={false} />
    </div>
  );
}

export default SharedPage;
