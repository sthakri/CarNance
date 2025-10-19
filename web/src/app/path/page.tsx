"use client";
import React from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { saveSubmitted } from "@/lib/store/slices/onboardingSlice";
import { CelestialBackground } from "@/components/celestial/celestial-background";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function FinancePathPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const last = useAppSelector((s) => s.onboarding.lastSubmitted || s.onboarding.draft);
  const [value, setValue] = React.useState<"lease" | "buy" | undefined>(last?.financePath as any);

  async function continueNext() {
    if (!value) return;
    // Try to persist financePath into latest submission on disk
    try {
      await axios.put("/api/onboarding", { data: { financePath: value } });
    } catch {
      // non-blocking; proceed with Redux state
    }
    // Update Redux lastSubmitted so downstream pages have it in-memory immediately
    const merged = { ...(last || {}), financePath: value } as any;
    dispatch(saveSubmitted(merged));
    router.push("/results");
  }

  return (
    <main className="relative mx-auto max-w-4xl px-6 py-10">
      <CelestialBackground />
      <section className="relative z-10 space-y-8">
        <PageHeader
          title="Choose Your Finance Path"
          subtitle="Pick the strategy that fits your goals"
        />

        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardContent className="space-y-6 p-6">
            <RadioGroup value={value} onValueChange={(v) => setValue(v as any)} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col space-y-2 rounded-lg bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lease" id="lease" />
                  <label htmlFor="lease" className="font-semibold">Lease Path</label>
                </div>
                <p className="pl-6 text-xs text-white/60">Lower monthly payments, new car more often</p>
              </div>
              <div className="flex flex-col space-y-2 rounded-lg bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="buy" id="buy" />
                  <label htmlFor="buy" className="font-semibold">Buy Path</label>
                </div>
                <p className="pl-6 text-xs text-white/60">Own your car, build equity, long-term value</p>
              </div>
              
            </RadioGroup>

            <div className="flex items-center justify-end">
              <Button onClick={continueNext} disabled={!value} className="bg-indigo-600 hover:bg-indigo-500">Continue</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
