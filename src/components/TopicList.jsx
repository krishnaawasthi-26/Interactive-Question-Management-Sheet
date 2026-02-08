import { useSheetStore } from "../store/sheetStore";

function TopicList() {
  const topics = useSheetStore((state) => state.topics);

  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <div
          key={topic.id}
          className="p-4 bg-white border rounded shadow"
        >
          <h2 className="text-lg font-semibold">{topic.title}</h2>
        </div>
      ))}
    </div>
  );
}

export default TopicList;
