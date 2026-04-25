import { useState } from "react";
import "./PremiumLotusBadge.css";

function PremiumLotusBadge({
  active,
  size = "sm",
  className = "",
  showTooltip = true,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!active) return null;

  const classes = ["premium-lotus-badge", `premium-lotus-badge--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} title={showTooltip ? "Premium member" : undefined} aria-label="Premium member">
      {/* NOTE: Replace this with a properly licensed non-watermarked production asset before release. */}
      {imageFailed ? (
        <span className="premium-lotus-badge__emoji" aria-hidden="true">🪷</span>
      ) : (
        <img
          src="https://png.pngtree.com/png-vector/20240611/ourlarge/pngtree-white-lotus-flower-png-image_12647347.png"
          alt="Premium lotus badge"
          className="premium-lotus-badge__image"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      )}
    </span>
  );
}

export default PremiumLotusBadge;
