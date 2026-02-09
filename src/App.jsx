import { useState } from "react";
import { useSheetStore } from "./store/sheetStore";
import AddTopicForm from "./components/AddTopicForm";
import Header from "./components/Header";
import TopicList from "./components/TopicList";

function App() {
  const [title, setTitle] = useState("");
  const [isEditing, setIsEditing] = useState(true); // toggle edit/view mode
  const addTopic = useSheetStore((state) => state.addTopic);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTopic(title);
    setTitle("");
  };

  return (
    // Page background + global text color
    <div className="min-h-screen bg-[rgb(24_24_27/var(--tw-bg-opacity,1))] text-white">
      {/* Centered content */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
         <Header
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
        />

        {/* Add Topic area — only show in edit mode */}
        {isEditing && ( <AddTopicForm
            title={title}
            onTitleChange={(e) => setTitle(e.target.value)}
            onAdd={handleAdd}
          />
        )}

        {/* Main sheet / cards container */}
        <main>
          <TopicList isEditing={isEditing} /> {/* pass editing state */}
        </main>
      </div>
    </div>
  );
}

export default App;