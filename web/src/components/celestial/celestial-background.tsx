"use client";

import * as React from "react";
import clsx from "clsx";

export function CelestialBackground({ className }: { className?: string }) {
  return (
    <div className={clsx("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)} aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-[#0b0b1a] to-[#070711]" />
      {/* parallax star layers */}
      <div className="absolute inset-0 animate-[pulse_20s_ease-in-out_infinite] opacity-70 bg-[url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'><circle cx=\'10\' cy=\'10\' r=\'1\' fill=\'%23fff\' opacity=\'0.9\'/><circle cx=\'80\' cy=\'50\' r=\'1\' fill=\'%23fff\' opacity=\'0.7\'/><circle cx=\'150\' cy=\'120\' r=\'1\' fill=\'%23fff\' opacity=\'0.6\'/></svg>')] bg-repeat" />
      <div className="absolute inset-0 translate-x-6 animate-[float_30s_linear_infinite] opacity-50 bg-[url('data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'><circle cx=\'40\' cy=\'60\' r=\'1\' fill=\'%23fff\' opacity=\'0.6\'/><circle cx=\'180\' cy=\'90\' r=\'1\' fill=\'%23fff\' opacity=\'0.5\'/></svg>')] bg-repeat" />
      {/* soft nebulas */}
      <div className="absolute -left-32 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute right-0 top-1/3 h-96 w-96 -translate-x-1/3 rounded-full bg-fuchsia-500/10 blur-3xl" />
    </div>
  );
}
