"use client";
import React from "react";

// Very small lightweight SVG line chart for quick projections
export default function LineChart({
  data,
  width = 600,
  height = 180,
  color = "#7c3aed",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const padding = 12;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((v - min) / (max - min || 1)) * (height - padding * 2);
    return `${x},${y}`;
  });
  const path = `M${points.join(" L ")}`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`${path} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`} fill="url(#grad)" opacity={0.6} />
    </svg>
  );
}
