function StatCard({ label, value, helper, tone = "default", onClick }) {
  const WrapperTag = onClick ? "button" : "article";

  return (
    <WrapperTag
      className={`stat-card stat-${tone} ${onClick ? "w-full text-left transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-info)]" : ""}`.trim()}
      {...(onClick ? { type: "button", onClick } : {})}
    >
      <p className="caption-text">{label}</p>
      <p className="card-title mt-1">{value}</p>
      {helper ? <p className="meta-text mt-1">{helper}</p> : null}
    </WrapperTag>
  );
}

export default StatCard;
