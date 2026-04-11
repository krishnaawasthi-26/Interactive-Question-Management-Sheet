function SurfaceCard({
  title,
  description,
  actions,
  children,
  className = "",
  elevated = false,
}) {
  return (
    <section className={`surface-card ${elevated ? "surface-card-elevated" : ""} ${className}`.trim()}>
      {(title || description || actions) ? (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="section-title">{title}</h2> : null}
            {description ? <p className="meta-text mt-1">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export default SurfaceCard;
