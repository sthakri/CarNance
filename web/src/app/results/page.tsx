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
import { ArrowLeft, DollarSign, Fuel, Star, TrendingUp } from "lucide-react";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  bodyType: string;
  msrp: number;
  fuelType: string;
  mpgCombined: number;
  mpge?: number;
  safetyRating: number;
  horsepower: number;
  seats: number;
  image: string;
  features: string[];
};

type Recommendation = {
  rank: number;
  vehicle: Vehicle;
  monthlyPayment: number;
  reasons: string[];
  score: number;
};

type ApiResponse = {
  ok: boolean;
  eligible?: boolean;
  reason?: string;
  suggestedActions?: string[];
  recommendations?: Recommendation[];
  maxMonthlyPayment?: number;
  averageCompetitorCost?: number | null;
};

export default function ResultsPage() {
  const router = useRouter();
  const lastSubmitted = useAppSelector((state) => state.onboarding.lastSubmitted);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getUserAndRecommend() {
      try {
        setLoading(true);

        // If Redux has no data (e.g., page refresh), load latest submission from API
        let payload = lastSubmitted as any;
        if (!payload) {
          const latestRes = await axios.get("/api/onboarding?latest=1");
          payload = latestRes.data?.submission?.data;
          if (!payload) {
            router.push("/form");
            return;
          }
        }

        const res = await axios.post<ApiResponse>("/api/recommend", payload);
        setData(res.data);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    }

    getUserAndRecommend();
  }, [lastSubmitted, router]);

  if (loading) {
    return (
      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <CelestialBackground />
        <section className="relative z-10 space-y-8">
          <PageHeader
            title="Finding your perfect match..."
            subtitle="Analyzing your profile"
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-white/10 bg-white/5 backdrop-blur">
                <CardHeader>
                  <Skeleton className="h-48 w-full rounded-lg" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <CelestialBackground />
        <section className="relative z-10 space-y-8">
          <PageHeader
            title="Oops!"
            subtitle={error || "Something went wrong"}
          />
          <div className="flex justify-center">
            <Button onClick={() => router.push("/form")} variant="outline">
              <ArrowLeft className="mr-2 size-4" />
              Back to form
            </Button>
          </div>
        </section>
      </main>
    );
  }

  // Handle ineligibility
  if (data.ok === false || data.eligible === false) {
    return (
      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <CelestialBackground />
        <section className="relative z-10 space-y-8">
          <PageHeader
            title="We're Sorry"
            subtitle="Unfortunately, you don't qualify at this time"
          />
          
          <Card className="border-red-400/30 bg-red-500/10 text-white backdrop-blur max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl text-red-200">Ineligibility Notice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-white/90">{data.reason}</p>
              
              {data.suggestedActions && data.suggestedActions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-white">Here's what you can do:</h3>
                  <ul className="space-y-2 list-disc pl-6">
                    {data.suggestedActions.map((action, idx) => (
                      <li key={idx} className="text-white/80">{action}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="pt-4 flex gap-4">
                <Button 
                  onClick={() => router.push("/form")} 
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Update Information
                </Button>
                <Button 
                  onClick={() => router.push("/")}
                  className="bg-white/10 hover:bg-white/20"
                >
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  if (!data.recommendations || data.recommendations.length === 0) {
    return (
      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <CelestialBackground />
        <section className="relative z-10 space-y-8">
          <PageHeader
            title="No Matches Found"
            subtitle="We couldn't find any vehicles matching your criteria"
          />
          <div className="flex justify-center">
            <Button onClick={() => router.push("/form")} variant="outline">
              <ArrowLeft className="mr-2 size-4" />
              Back to form
            </Button>
          </div>
        </section>
      </main>
    );
  }

  // Save comparison data for resume page
  const saveComparisonData = (vehicle: Vehicle, costAnalysis: any) => {
    const allVehicles = data.recommendations!.map((rec: any) => ({
      id: rec.vehicle.id,
      make: rec.vehicle.make,
      model: rec.vehicle.model,
      trim: rec.vehicle.trim,
      year: rec.vehicle.year,
      msrp: rec.vehicle.msrp,
      monthlyPayment: rec.monthlyPayment,
      netCost: rec.costAnalysis?.netCost || 0,
      totalFuelCost: rec.costAnalysis?.totalFuelCost || 0,
      totalMaintenanceCost: rec.costAnalysis?.totalMaintenanceCost || 0,
      totalInsuranceCost: rec.costAnalysis?.totalInsuranceCost || 0,
      resaleValue: rec.costAnalysis?.resaleValue || 0,
      mpgCombined: rec.vehicle.mpgCombined,
      fuelType: rec.vehicle.fuelType,
    }));

    const avgNetCost = allVehicles.reduce((sum, v) => sum + v.netCost, 0) / allVehicles.length;
    const avgMonthlyPayment = allVehicles.reduce((sum, v) => sum + v.monthlyPayment, 0) / allVehicles.length;
    const avgFuelCost = allVehicles.reduce((sum, v) => sum + v.totalFuelCost, 0) / allVehicles.length;
    const avgMaintenanceCost = allVehicles.reduce((sum, v) => sum + v.totalMaintenanceCost, 0) / allVehicles.length;

    const chosenData = allVehicles.find(v => v.id === vehicle.id);
    if (!chosenData) return;

    const savingsData = {
      chosenVehicle: chosenData,
      competitorAverage: {
        netCost: avgNetCost,
        monthlyPayment: avgMonthlyPayment,
        totalFuelCost: avgFuelCost,
        totalMaintenanceCost: avgMaintenanceCost,
      },
      allVehicles,
    };

    localStorage.setItem("carComparison", JSON.stringify(savingsData));
  };

  return (
    <main className="relative mx-auto max-w-7xl px-6 py-10">
      <CelestialBackground />
      <section className="relative z-10 space-y-8">
        <div className="flex items-start justify-between">
          <PageHeader
            title="Your Perfect Matches"
            subtitle={`Based on your $${data.maxMonthlyPayment}/mo budget`}
          />
          <Button onClick={() => router.push("/form")} variant="ghost" size="sm">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {data.recommendations.map((rec) => (
            <Card
              key={rec.vehicle.id}
              className="group relative overflow-hidden border-white/10 bg-white/5 text-white backdrop-blur transition-all hover:border-indigo-400/50 hover:bg-white/10"
            >
              {rec.rank === 1 && (
                <div className="absolute right-4 top-4 z-10">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    <Star className="mr-1 size-3 fill-white" />
                    Top Pick
                  </Badge>
                </div>
              )}

              <CardHeader className="p-0">
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
                  <img
                    src={rec.vehicle.image}
                    alt={`${rec.vehicle.year} ${rec.vehicle.make} ${rec.vehicle.model}`}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <div>
                  <CardTitle className="text-2xl font-bold">
                    {rec.vehicle.year} {rec.vehicle.model}
                  </CardTitle>
                  <p className="text-sm text-white/60">
                    {rec.vehicle.make} • {rec.vehicle.trim}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-indigo-300">
                    ${rec.monthlyPayment}
                  </span>
                  <span className="text-sm text-white/60">/month</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="size-4 text-green-400" />
                    <span>MSRP: ${rec.vehicle.msrp.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Fuel className="size-4 text-blue-400" />
                    <span>
                      {rec.vehicle.fuelType === "electric"
                        ? `${rec.vehicle.mpge} MPGe`
                        : `${rec.vehicle.mpgCombined} MPG`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="size-4 text-yellow-400" />
                    <span>{rec.vehicle.safetyRating}-star safety</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="size-4 text-purple-400" />
                    <span>
                      {rec.vehicle.horsepower} HP • {rec.vehicle.seats} seats
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    Why this car?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rec.reasons.slice(0, 3).map((reason, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="border-indigo-400/30 bg-indigo-500/10 text-xs text-indigo-200"
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-500"
                    onClick={() => router.push(`/insights/${rec.vehicle.id}`)}
                  >
                    View Insights
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-green-400/30 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                    onClick={() => {
                      saveComparisonData(rec.vehicle, (rec as any).costAnalysis);
                      router.push("/resume");
                    }}
                  >
                    See Savings Comparison
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => router.push("/insights")}
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
          >
            <TrendingUp className="mr-2 size-5" />
            View Financial Insights & 5-Year Projections
          </Button>
        </div>

        <Card className="border-white/10 bg-white/5 text-white backdrop-blur">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">About Your Recommendations</h3>
            <div className="space-y-2 text-sm text-white/80">
              <p>
                • These recommendations are based on your monthly income, credit score, daily
                driving needs, and preferences.
              </p>
              <p>
                • Monthly payments are estimated for a 60-month loan with typical interest rates
                for your credit tier.
              </p>
              <p>
                • All vehicles include Toyota Safety Sense and come with comprehensive warranties.
              </p>
              <p className="pt-2 text-xs text-white/60">
                Final pricing and availability subject to dealer confirmation. Tax, title, and
                fees not included.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
