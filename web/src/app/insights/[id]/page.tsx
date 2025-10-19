"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/store";
import { useRouter } from "next/navigation";
import axios from "axios";
import { CelestialBackground } from "@/components/celestial/celestial-background";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type VehicleInsights = {
  vehicleId: string;
  vehicleName: string;
  financePath: string;
  fiveYearProjection: {
    totalCost: number;
    monthlyBreakdown: {
      payment: number;
      insurance: number;
      fuel: number;
      maintenance: number;
      total: number;
    };
    breakdown: {
      principal: number;
      interest: number;
      fuel: number;
      insurance: number;
      maintenance: number;
    };
  };
  creditImpact: {
    currentScore: string;
    projectedScoreAfter12Months: number;
    projectedScoreAfter60Months: number;
    scoreDelta: number;
    impactLevel: string;
    explanation: string;
  };
  savingsAnalysis: {
    vsAverageCar: {
      amount: number;
      category: string;
    };
    vsOtherOptions: {
      comparedTo: string;
      amount: number;
    }[];
  };
  recommendation: {
    isTopChoice: boolean;
    reason: string;
    pros: string[];
    cons: string[];
  };
};

export default function SingleInsightsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const lastSubmitted = useAppSelector((s) => s.onboarding.lastSubmitted);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<VehicleInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSingleInsight() {
      try {
        setLoading(true);

        // Recover user data if Redux is empty
        let userData = lastSubmitted as any;
        if (!userData) {
          const latestRes = await axios.get("/api/onboarding?latest=1");
          userData = latestRes.data?.submission?.data;
          if (!userData) {
            router.push("/form");
            return;
          }
        }

        // Get recommendations to compute monthly payment for the selected car
        const recRes = await axios.post("/api/recommend", userData);
        const recommendations = recRes.data.recommendations as Array<{
          vehicle: { id: string };
          monthlyPayment: number;
          rank: number;
        }>;

        const selected = recommendations.find((r) => r.vehicle.id === params.id);
        if (!selected) {
          // If the chosen car isn't in current top recommendations, still allow computing insights
          // Fall back: pick the closest by id match to compute via inventory
          // We'll synthesize a monthly payment using the recommend API by temporarily appending
          // but since API doesn't support single, we gracefully show not found
          setError("Selected car is not in your current recommendations.");
          return;
        }

        const insightsRes = await axios.post("/api/insights", {
          userData,
          recommendedVehicles: [
            {
              vehicleId: params.id,
              monthlyPayment: selected.monthlyPayment,
              rank: selected.rank,
            },
          ],
        });

        const list = insightsRes.data.insights as VehicleInsights[];
        setInsight(list[0]);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load insights");
      } finally {
        setLoading(false);
      }
    }

    fetchSingleInsight();
  }, [lastSubmitted, params.id, router]);

  if (loading) {
    return (
      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <CelestialBackground />
        <section className="relative z-10 space-y-8">
          <PageHeader title="Preparing your insights..." subtitle="One moment" />
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  if (error || !insight) {
    return (
      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <CelestialBackground />
        <section className="relative z-10 space-y-8">
          <PageHeader title="Oops!" subtitle={error || "No insights available"} />
          <div className="flex justify-center">
            <Button onClick={() => router.push("/results")} variant="outline">
              <ArrowLeft className="mr-2 size-4" />
              Back to results
            </Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="relative mx-auto max-w-7xl px-6 py-10">
      <CelestialBackground />
      <section className="relative z-10 space-y-8">
        <div className="flex items-start justify-between">
          <PageHeader title="Vehicle Insights" subtitle={insight.vehicleName} />
          <Button onClick={() => router.push("/results")} variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
        </div>

        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{insight.vehicleName}</CardTitle>
              <Badge variant="outline" className="capitalize">
                {insight.financePath} Path
              </Badge>
            </div>
            <p className="text-sm text-white/70">{insight.recommendation.reason}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <DollarSign className="size-5 text-green-400" />
                5-Year Cost Projection
              </h3>
              <div className="rounded-lg bg-white/5 p-4">
                <div className="mb-3 text-center">
                  <p className="text-sm text-white/60">Total 5-Year Cost</p>
                  <p className="text-3xl font-bold text-indigo-300">
                    ${insight.fiveYearProjection.totalCost.toLocaleString()}
                  </p>
                </div>
                <Separator className="my-3 bg-white/10" />
                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                  <div>
                    <p className="text-white/60">Payment</p>
                    <p className="font-semibold">${insight.fiveYearProjection.monthlyBreakdown.payment}/mo</p>
                  </div>
                  <div>
                    <p className="text-white/60">Insurance</p>
                    <p className="font-semibold">${insight.fiveYearProjection.monthlyBreakdown.insurance}/mo</p>
                  </div>
                  <div>
                    <p className="text-white/60">Fuel</p>
                    <p className="font-semibold">${insight.fiveYearProjection.monthlyBreakdown.fuel}/mo</p>
                  </div>
                  <div>
                    <p className="text-white/60">Maintenance</p>
                    <p className="font-semibold">${insight.fiveYearProjection.monthlyBreakdown.maintenance}/mo</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-white/60">Total/Month</p>
                    <p className="font-bold text-indigo-300">${insight.fiveYearProjection.monthlyBreakdown.total}/mo</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="size-5 text-purple-400" />
                Credit Score Impact
              </h3>
              <div className="rounded-lg bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Current Range</p>
                    <p className="text-lg font-semibold">{insight.creditImpact.currentScore}</p>
                  </div>
                  <TrendingUp className="size-6 text-green-400" />
                  <div>
                    <p className="text-sm text-white/60">After 5 Years</p>
                    <p className="text-lg font-bold text-green-400">{insight.creditImpact.projectedScoreAfter60Months}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`mb-2 ${
                  insight.creditImpact.impactLevel === "excellent"
                    ? "border-green-400 text-green-400"
                    : insight.creditImpact.impactLevel === "good"
                    ? "border-blue-400 text-blue-400"
                    : "border-yellow-400 text-yellow-400"
                }`}>
                  {insight.creditImpact.impactLevel.toUpperCase()} Impact (+{insight.creditImpact.scoreDelta} points)
                </Badge>
                <p className="text-sm text-white/70">{insight.creditImpact.explanation}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <PiggyBank className="size-5 text-pink-400" />
                Savings Analysis
              </h3>
              <div className="space-y-3 rounded-lg bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">vs. Average Car</span>
                  <span
                    className={`flex items-center gap-1 font-semibold ${
                      insight.savingsAnalysis.vsAverageCar.amount > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {insight.savingsAnalysis.vsAverageCar.amount > 0 ? (
                      <TrendingDown className="size-4" />
                    ) : (
                      <TrendingUp className="size-4" />
                    )}
                    {Math.abs(insight.savingsAnalysis.vsAverageCar.amount) > 0
                      ? `$${Math.abs(insight.savingsAnalysis.vsAverageCar.amount).toLocaleString()} ${
                          insight.savingsAnalysis.vsAverageCar.amount > 0 ? "saved" : "more"
                        }`
                      : "Similar cost"}
                  </span>
                </div>
                {insight.savingsAnalysis.vsOtherOptions.map((comp, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-white/60">vs. {comp.comparedTo}</span>
                    <span className={`font-semibold ${comp.amount < 0 ? "text-green-400" : "text-red-400"}`}>
                      {Math.abs(comp.amount) > 0
                        ? `$${Math.abs(comp.amount).toLocaleString()} ${comp.amount < 0 ? "saved" : "more"}`
                        : "Same cost"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-semibold text-green-400">
                  <CheckCircle2 className="size-4" />
                  Pros
                </h4>
                <ul className="space-y-1 text-sm text-white/80">
                  {insight.recommendation.pros.map((pro, i) => (
                    <li key={i}>• {pro}</li>
                  ))}
                </ul>
              </div>
              {insight.recommendation.cons.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-semibold text-orange-400">
                    <AlertCircle className="size-4" />
                    Considerations
                  </h4>
                  <ul className="space-y-1 text-sm text-white/80">
                    {insight.recommendation.cons.map((con, i) => (
                      <li key={i}>• {con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
