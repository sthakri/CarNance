"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/store";
import { useRouter, useSearchParams } from "next/navigation";
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
  CheckCircle2,
  XCircle,
  AlertCircle,
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

export default function InsightsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastSubmitted = useAppSelector((state) => state.onboarding.lastSubmitted);
  
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<VehicleInsights[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lastSubmitted) {
      router.push("/form");
      return;
    }

    async function fetchInsights() {
      try {
        setLoading(true);
        
        // First get recommendations
        const recRes = await axios.post("/api/recommend", lastSubmitted);
        const recommendations = recRes.data.recommendations;
        
        // Then get insights
        const insightsRes = await axios.post("/api/insights", {
          userData: lastSubmitted,
          recommendedVehicles: recommendations.map((r: any) => ({
            vehicleId: r.vehicle.id,
            monthlyPayment: r.monthlyPayment,
            rank: r.rank,
          })),
        });
        
        setInsights(insightsRes.data.insights);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load insights");
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [lastSubmitted, router]);

  if (loading) {
    return (
      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <CelestialBackground />
        <section className="relative z-10 space-y-8">
          <PageHeader
            title="Analyzing your financial future..."
            subtitle="Crunching the numbers"
          />
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-white/10 bg-white/5 backdrop-blur">
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (error || insights.length === 0) {
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
          <PageHeader
            title="Financial Insights"
            subtitle="5-year projections and smart recommendations"
          />
          <Button onClick={() => router.push("/results")} variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
        </div>

        {insights.map((insight, idx) => (
          <Card
            key={insight.vehicleId}
            className={`border-white/10 bg-white/5 text-white backdrop-blur ${
              insight.recommendation.isTopChoice ? "ring-2 ring-indigo-500" : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {insight.vehicleName}
                  {insight.recommendation.isTopChoice && (
                    <Badge className="ml-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      Top Financial Choice
                    </Badge>
                  )}
                </CardTitle>
                <Badge variant="outline" className="capitalize">
                  {insight.financePath} Path
                </Badge>
              </div>
              <p className="text-sm text-white/70">{insight.recommendation.reason}</p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 5-Year Cost Projection */}
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
                      <p className="font-semibold">
                        ${insight.fiveYearProjection.monthlyBreakdown.payment}/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">Insurance</p>
                      <p className="font-semibold">
                        ${insight.fiveYearProjection.monthlyBreakdown.insurance}/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">Fuel</p>
                      <p className="font-semibold">
                        ${insight.fiveYearProjection.monthlyBreakdown.fuel}/mo
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">Maintenance</p>
                      <p className="font-semibold">
                        ${insight.fiveYearProjection.monthlyBreakdown.maintenance}/mo
                      </p>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <p className="text-white/60">Total/Month</p>
                      <p className="font-bold text-indigo-300">
                        ${insight.fiveYearProjection.monthlyBreakdown.total}/mo
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit Score Impact */}
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
                      <p className="text-lg font-bold text-green-400">
                        {insight.creditImpact.projectedScoreAfter60Months}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`mb-2 ${
                      insight.creditImpact.impactLevel === "excellent"
                        ? "border-green-400 text-green-400"
                        : insight.creditImpact.impactLevel === "good"
                        ? "border-blue-400 text-blue-400"
                        : "border-yellow-400 text-yellow-400"
                    }`}
                  >
                    {insight.creditImpact.impactLevel.toUpperCase()} Impact (+
                    {insight.creditImpact.scoreDelta} points)
                  </Badge>
                  <p className="text-sm text-white/70">{insight.creditImpact.explanation}</p>
                </div>
              </div>

              {/* Savings Analysis */}
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
                        insight.savingsAnalysis.vsAverageCar.amount > 0
                          ? "text-green-400"
                          : "text-red-400"
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
                      <span
                        className={`font-semibold ${
                          comp.amount < 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {Math.abs(comp.amount) > 0
                          ? `$${Math.abs(comp.amount).toLocaleString()} ${
                              comp.amount < 0 ? "saved" : "more"
                            }`
                          : "Same cost"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pros & Cons */}
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
        ))}

        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">How We Calculate These Insights</h3>
            <div className="space-y-2 text-sm text-white/80">
              <p>
                • <strong>5-Year Projections:</strong> Include principal, interest, fuel (based on
                your daily miles), insurance estimates, and maintenance costs.
              </p>
              <p>
                • <strong>Credit Impact:</strong> Based on payment-to-income ratio, consistency, and
                your chosen finance path. Assumes on-time payments.
              </p>
              <p>
                • <strong>Savings:</strong> Compared against national average car ownership costs
                (~$45k/5yr) and other recommended vehicles.
              </p>
              <p className="pt-2 text-xs text-white/60">
                All projections are estimates. Actual costs may vary based on dealer pricing,
                location, driving habits, and market conditions.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
