import { useEffect, useState } from "react";
import TopicList from "../components/TopicList";
import { fetchSharedProfile } from "../api/profileApi";
import { getSharedSheet } from "../api/sheetApi";
import { useSheetStore } from "../store/sheetStore";

function SharedPage({ shareType, shareId }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const sheetTitle = useSheetStore((state) => state.sheetTitle);
  const setReadOnlySheet = useSheetStore((state) => state.setReadOnlySheet);

  useEffect(() => {
    const load = async () => {
      try {
        if (shareType === "profile") {
          const data = await fetchSharedProfile(shareId);
          setProfile(data);
          return;
        }

        const sheet = await getSharedSheet(shareId);
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
      <div className="min-h-screen bg-zinc-900 text-white p-6">
        <h1 className="text-2xl font-semibold mb-4">{profile?.name}&apos;s profile</h1>
        <div className="space-y-2">
          {profile?.sheets?.map((sheet) => (
            <a className="block rounded border border-gray-700 p-3" key={sheet.id} href={`#/shared/sheet/${sheet.shareId}`}>
              {sheet.title}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <h1 className="text-2xl font-semibold mb-4">{sheetTitle} (Read only)</h1>
      <TopicList isEditing={false} />
    </div>
  );
}

export default SharedPage;
