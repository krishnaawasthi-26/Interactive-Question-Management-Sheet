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

  const chartSize = useMemo(() => {
    if (items.length >= 14) return 420;
    if (items.length >= 10) return 380;
    if (items.length >= 7) return 340;
    return 300;
  }, [items.length]);

  const center = chartSize / 2;
  const outerRadius = Math.round(chartSize * 0.31);
  const innerRadius = Math.round(chartSize * 0.17);
  const labelRadius = outerRadius + 18;
  const arrowRadius = outerRadius + 8;

  const slices = useMemo(() => {
    let start = 0;
    return items.map((item) => {
      const angle = total > 0 ? (item.count / total) * 360 : 0;
      const slice = { ...item, start, end: start + angle };
      start += angle;
      return slice;
    });
  }, [items, total]);

  const activeSlice = useMemo(() => slices.find((slice) => slice.key === activeKey) || null, [activeKey, slices]);

  if (!total) return <div className="flex h-56 items-center justify-center text-sm text-[var(--text-secondary)]">No questions yet</div>;

  return (
    <div className="relative" style={{ height: chartSize, width: chartSize }}>
      <svg viewBox={`0 0 ${chartSize} ${chartSize}`} className="h-full w-full">
        {slices.map((slice) => {
          const active = activeKey === slice.key;
          const midAngle = (slice.start + slice.end) / 2;
          const arrowStart = polarToCartesian(center, center, outerRadius, midAngle);
          const arrowBend = polarToCartesian(center, center, arrowRadius, midAngle);
          const labelPoint = polarToCartesian(center, center, labelRadius, midAngle);
          const textAnchor = labelPoint.x >= center ? "start" : "end";
          const horizontalOffset = labelPoint.x >= center ? 10 : -10;
          const labelX = labelPoint.x + horizontalOffset;

          return (
            <g key={slice.key}>
              <path
                d={arcPath(center, center, innerRadius, outerRadius, slice.start, slice.end)}
                fill={slice.color}
                stroke={active ? "#ffffff" : "#111"}
                strokeWidth={active ? "2.4" : "1.4"}
                onMouseEnter={() => setActiveKey(slice.key)}
                onMouseLeave={() => setActiveKey(null)}
                onFocus={() => setActiveKey(slice.key)}
                onBlur={() => setActiveKey((current) => (current === slice.key ? null : current))}
                role="presentation"
                aria-label={`${slice.label}: ${slice.count}`}
              />
              <polyline
                points={`${arrowStart.x},${arrowStart.y} ${arrowBend.x},${arrowBend.y} ${labelX},${labelPoint.y}`}
                fill="none"
                stroke={slice.color}
                strokeWidth={active ? "2.4" : "1.6"}
                opacity={active ? 1 : 0.8}
              />
              <text
                x={labelX + (textAnchor === "start" ? 2 : -2)}
                y={labelPoint.y - 2}
                textAnchor={textAnchor}
                fontSize={items.length > 12 ? "10" : "11"}
                fill="var(--text-primary)"
                className="font-medium"
              >
                {slice.label}
              </text>
            </g>
          );
        })}
        <circle cx={center} cy={center} r={innerRadius - 6} fill="var(--surface-elevated)" />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-[var(--text-secondary)]">Total</span>
        <span className="text-2xl font-semibold text-[var(--text-primary)]">{total}</span>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-1/2 w-[90%] -translate-x-1/2 rounded-md bg-[var(--surface)]/85 px-2 py-1 text-center text-xs text-[var(--text-secondary)] backdrop-blur-sm">
        {activeSlice ? `${activeSlice.label}: ${activeSlice.count} questions` : "Hover a section to see details"}
      </div>
    </div>
  );
}

export default DonutChart;
