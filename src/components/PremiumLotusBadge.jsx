import { useMemo, useState } from "react";

const LOTUS_BADGE_IMAGE_URL = "https://png.pngtree.com/png-vector/20240611/ourlarge/pngtree-white-lotus-flower-png-image_12647347.png";

function PremiumLotusBadge({
  active = false,
  size = "sm",
  className = "",
  showTooltip = true,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const normalizedSize = useMemo(() => {
    if (size === "avatar") return "avatar";
    if (size === "lg") return "lg";
    return "sm";
  }, [size]);

  if (!active) return null;

  return (
    <span
      className={`lotus-premium-badge lotus-premium-badge--${normalizedSize} ${className}`.trim()}
      title={showTooltip ? "Premium member" : undefined}
      aria-label="Lotus Premium"
    >
      {imageFailed ? (
        <span className="lotus-premium-badge__emoji" aria-hidden="true">🪷</span>
      ) : (
        <img
          className="lotus-premium-badge__image"
          src={LOTUS_BADGE_IMAGE_URL}
          alt="Premium lotus badge"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      )}
    </span>
  );
}

export default PremiumLotusBadge;
