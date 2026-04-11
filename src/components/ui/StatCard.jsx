function StatCard({ label, value, helper, tone = "default" }) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <p className="caption-text">{label}</p>
      <p className="card-title mt-1">{value}</p>
      {helper ? <p className="meta-text mt-1">{helper}</p> : null}
    </article>
  );
}

export default StatCard;
