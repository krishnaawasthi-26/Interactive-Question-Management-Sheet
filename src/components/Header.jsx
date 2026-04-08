function Header({ title, onTitleChange }) {
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
    </header>
  );
}

export default Header;
