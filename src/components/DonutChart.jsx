import { useMemo, useState } from "react";

const polarToCartesian = (cx, cy, radius, angleInDegrees) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return { x: cx + radius * Math.cos(angleInRadians), y: cy + radius * Math.sin(angleInRadians) };
};

const arcPath = (cx, cy, innerRadius, outerRadius, startAngle, endAngle) => {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
};

function DonutChart({ items, total }) {
  const [activeKey, setActiveKey] = useState(null);
  const slices = useMemo(() => {
    let start = 0;
    return items.map((item) => {
      const angle = total > 0 ? (item.count / total) * 360 : 0;
      const slice = { ...item, start, end: start + angle };
      start += angle;
      return slice;
    });
  }, [items, total]);

  if (!total) return <div className="flex h-56 items-center justify-center text-sm text-[var(--text-secondary)]">No questions yet</div>;

  return (
    <div className="relative h-56 w-56">
      <svg viewBox="0 0 220 220" className="h-full w-full">
        {slices.map((slice) => {
          const active = activeKey === slice.key;
          const midAngle = (slice.start + slice.end) / 2;
          const nudge = active ? 4 : 0;
          const point = polarToCartesian(110, 110, nudge, midAngle);
          return (
            <path
              key={slice.key}
              d={arcPath(point.x, point.y, 56, active ? 94 : 90, slice.start, slice.end)}
              fill={slice.color}
              stroke="#111"
              strokeWidth="1.4"
              onMouseEnter={() => setActiveKey(slice.key)}
              onMouseLeave={() => setActiveKey(null)}
              onClick={() => setActiveKey((current) => (current === slice.key ? null : slice.key))}
            />
          );
        })}
        <circle cx="110" cy="110" r="48" fill="var(--surface-elevated)" />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-[var(--text-secondary)]">Total</span>
        <span className="text-2xl font-semibold text-[var(--text-primary)]">{total}</span>
      </div>
    </div>
  );
}

export default DonutChart;
