"use client";

import { Sparkles, Telescope } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function PageHeader({
  title,
  subtitle,
  icon: Icon = Sparkles,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 p-2 ring-1 ring-white/10">
          <Icon className="size-6 text-indigo-300" />
        </div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {title}
        </h1>
      </div>
      {subtitle ? (
        <p className="text-pretty text-sm text-white/70 md:text-base">
          {subtitle}
        </p>
      ) : null}
      <div className="mt-6">
        <Separator className="bg-white/10" />
      </div>
    </div>
  );
}
