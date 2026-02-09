function Header({ isEditing, onToggleEdit }) {
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {/* Logo placeholder */}
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center font-bold text-black">
          C
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Question Sheet</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Toggle Edit/View Mode Button */}
        <button
          onClick={onToggleEdit}
          className="px-3 py-1 rounded-md text-sm border border-gray-700 text-gray-200 hover:bg-gray-800 transition"
        >
          {isEditing ? "View Only" : "Edit Sheet"}
        </button>
      </div>
    </header>
  );
}

export default Header;
