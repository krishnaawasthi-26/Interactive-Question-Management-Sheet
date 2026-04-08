import { useState } from "react";
import ExportButton from "./ExportButton";
import UndoRedoControls from "./UndoRedoControls";
import { navigateTo, ROUTES } from "../services/hashRouter";

function Header({
  isEditing,
  onToggleEdit,
  onOpenExport,
  onLogout,
  title,
  onBackProfile,
  onCreateNewSheet,
  onTitleChange,
}) {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-red-500 font-bold text-black">
          C
        </div>
        <input
          value={title}
          onChange={(event) => onTitleChange?.(event.target.value)}
          className="rounded border border-gray-700 bg-transparent px-3 py-1 text-2xl font-semibold tracking-tight"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsQuickMenuOpen((prev) => !prev)}
            className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-200"
            aria-label="Open quick menu"
          >
            ⋮
          </button>
          {isQuickMenuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-52 space-y-1 rounded-md border border-zinc-700 bg-zinc-900 p-2 shadow-lg">
              <button type="button" className="w-full rounded px-2 py-1 text-left text-sm hover:bg-zinc-800" onClick={() => navigateTo(ROUTES.PROFILE)}>Profile</button>
              <button type="button" className="w-full rounded px-2 py-1 text-left text-sm hover:bg-zinc-800" onClick={() => navigateTo(ROUTES.ABOUT)}>About Us</button>
              <button type="button" className="w-full rounded px-2 py-1 text-left text-sm hover:bg-zinc-800" onClick={() => navigateTo(ROUTES.HOW_TO_USE)}>How To Use</button>
              <button type="button" className="w-full rounded px-2 py-1 text-left text-sm hover:bg-zinc-800" onClick={() => navigateTo(ROUTES.CONTACT)}>Contact Us</button>
              <button type="button" className="w-full rounded px-2 py-1 text-left text-sm hover:bg-zinc-800" onClick={() => navigateTo(ROUTES.LEARNING_INSIGHTS)}>Learning Insights</button>
              <a
                href="https://leetcode.com"
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded px-2 py-1 text-left text-sm text-amber-300 hover:bg-zinc-800"
              >
                LeetCode
              </a>
            </div>
          )}
        </div>
        <button type="button" onClick={onBackProfile} className="rounded-md border border-zinc-700 px-3 py-1 text-sm text-zinc-200">Profile</button>
        <button type="button" onClick={onCreateNewSheet} className="rounded-md border border-orange-600 px-3 py-1 text-sm text-orange-200">New Sheet</button>
        <UndoRedoControls />
        <ExportButton onClick={onOpenExport} />
        <button
          onClick={onToggleEdit}
          className="rounded-md border border-gray-700 px-3 py-1 text-sm text-gray-200 transition hover:bg-gray-800"
        >
          {isEditing ? "View Only" : "Edit Sheet"}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md border border-rose-700 px-3 py-1 text-sm text-rose-200 transition hover:bg-rose-900/40"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
