function ConfirmationModal({
  isOpen,
  title,
  message,
  actions = [],
  onClose,
  isBusy = false,
}) {
  if (!isOpen) return null;

  const toneClassByVariant = {
    neutral: "btn-neutral",
    primary: "btn-primary",
    danger: "btn-danger",
    success: "btn-success",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div className="panel w-full max-w-md rounded-2xl border border-[var(--border-subtle)] p-5 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              disabled={isBusy || action.disabled}
              className={`btn-base px-3 py-2 text-sm ${toneClassByVariant[action.variant || "neutral"]}`}
            >
              {action.label}
            </button>
          ))}
        </div>

        {onClose ? (
          <button
            type="button"
            className="sr-only"
            onClick={onClose}
            aria-label="Close confirmation dialog"
          />
        ) : null}
      </div>
    </div>
  );
}

export default ConfirmationModal;
