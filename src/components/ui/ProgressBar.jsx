function ProgressBar({ percent = 0, tone = "success" }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safePercent}>
      <div className={`progress-fill progress-${tone}`} style={{ width: `${safePercent}%` }} />
    </div>
  );
}

export default ProgressBar;
