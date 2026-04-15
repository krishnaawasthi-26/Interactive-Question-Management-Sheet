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
    <div className="overlay-shell">
      <div className="overlay-panel max-w-md p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
          <p className="meta-text mt-2">{message}</p>
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
