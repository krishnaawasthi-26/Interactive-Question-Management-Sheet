import { useEffect, useState } from "react";
import TopicList from "../components/TopicList";
import { fetchSharedProfile } from "../api/profileApi";
import { getSharedSheet } from "../api/sheetApi";
import { useSheetStore } from "../store/sheetStore";
import { useAuthStore } from "../store/authStore";
import { navigateTo, ROUTES } from "../services/hashRouter";

function SharedPage({ shareType, shareId }) {
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

        const sheet = await getSharedSheet(shareId);
        setSharedSheet(sheet);
        setReadOnlySheet(sheet);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, [setReadOnlySheet, shareId, shareType]);

  if (error) return <div className="p-6 text-red-300">{error}</div>;

  if (shareType === "profile") {
    return (
      <div className="min-h-screen bg-zinc-900 p-6 text-white">
        <h1 className="mb-4 text-2xl font-semibold">{profile?.name}&apos;s profile</h1>
        <div className="space-y-2">
          {profile?.sheets?.map((sheet) => (
            <div className="flex items-center justify-between rounded border border-gray-700 p-3" key={sheet.id}>
              <a href={`#/shared/sheet/${sheet.shareId}`} className="font-medium underline-offset-2 hover:underline">
                {sheet.title}
              </a>
            </div>
          ))}
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
