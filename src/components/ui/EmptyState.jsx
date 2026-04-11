function EmptyState({ title, description, action, icon = "✦" }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden>{icon}</div>
      <h3 className="card-title mt-2">{title}</h3>
      {description ? <p className="meta-text mt-1 max-w-xl">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
