"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Fuel, 
  Wrench, 
  Shield,
  ArrowLeft,
  Award,
  Percent
} from "lucide-react";
import { CelestialBackground } from "@/components/celestial/celestial-background";

interface VehicleComparison {
  id: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  msrp: number;
  monthlyPayment: number;
  netCost: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalInsuranceCost: number;
  resaleValue: number;
  mpgCombined: number;
  fuelType: string;
}

interface SavingsData {
  chosenVehicle: VehicleComparison;
  competitorAverage: {
    netCost: number;
    monthlyPayment: number;
    totalFuelCost: number;
    totalMaintenanceCost: number;
  };
  allVehicles: VehicleComparison[];
}

export default function ResumePage() {
  const router = useRouter();
  const [savingsData, setSavingsData] = useState<SavingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("carComparison");
    if (stored) {
      setSavingsData(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <CelestialBackground />
        <div className="z-10 text-white text-xl">Loading your savings analysis...</div>
      </div>
    );
  }

  if (!savingsData) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center gap-4">
        <CelestialBackground />
        <div className="z-10 text-white text-xl">No comparison data available</div>
        <Button onClick={() => router.push("/results")} className="z-10">
          View Results
        </Button>
      </div>
    );
  }

  const { chosenVehicle, competitorAverage, allVehicles } = savingsData;
  
  // Calculate savings
  const totalSavings = competitorAverage.netCost - chosenVehicle.netCost;
  const monthlySavings = competitorAverage.monthlyPayment - chosenVehicle.monthlyPayment;
  const fuelSavings = competitorAverage.totalFuelCost - chosenVehicle.totalFuelCost;
  const maintenanceSavings = competitorAverage.totalMaintenanceCost - chosenVehicle.totalMaintenanceCost;
  const percentSavings = ((totalSavings / competitorAverage.netCost) * 100).toFixed(1);

  // Find best and worst alternatives
  const sortedByNetCost = [...allVehicles].sort((a, b) => a.netCost - b.netCost);
  const cheapest = sortedByNetCost[0];
  const mostExpensive = sortedByNetCost[sortedByNetCost.length - 1];
  
  const savingsVsCheapest = chosenVehicle.id === cheapest.id ? 0 : cheapest.netCost - chosenVehicle.netCost;
  const savingsVsMostExpensive = mostExpensive.netCost - chosenVehicle.netCost;

  return (
    <div className="relative min-h-screen pb-20">
      <CelestialBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Your Savings Summary
          </h1>
          <p className="text-blue-200 text-lg">
            See how much you're saving with your choice
          </p>
        </div>

        {/* Main Savings Card */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-lg mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              <Award className="h-6 w-6 text-yellow-400" />
              {chosenVehicle.year} {chosenVehicle.make} {chosenVehicle.model} {chosenVehicle.trim}
            </CardTitle>
            <CardDescription className="text-blue-200">
              5-Year Total Cost of Ownership Analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Total Savings Highlight */}
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-400/30 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-300 text-sm font-medium mb-1">TOTAL SAVINGS VS AVERAGE</div>
                  <div className="text-4xl font-bold text-white flex items-center gap-2">
                    {totalSavings >= 0 ? (
                      <>
                        <TrendingDown className="h-8 w-8 text-green-400" />
                        ${totalSavings.toLocaleString()}
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-8 w-8 text-red-400" />
                        ${Math.abs(totalSavings).toLocaleString()}
                      </>
                    )}
                  </div>
                  <div className="text-blue-200 text-sm mt-2">
                    Over 5 years compared to average competitor
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-500/20 text-green-300 text-2xl px-4 py-2">
                    <Percent className="h-5 w-5 inline mr-1" />
                    {percentSavings}%
                  </Badge>
                  <div className="text-blue-200 text-xs mt-2">savings rate</div>
                </div>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly Payment */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-200 font-medium">Monthly Payment</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">
                    ${chosenVehicle.monthlyPayment}
                  </div>
                  <div className={`text-sm ${monthlySavings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {monthlySavings >= 0 ? '-' : '+'}${Math.abs(monthlySavings)} vs avg
                  </div>
                </div>
              </div>

              {/* Fuel Costs */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-200 font-medium">Fuel Costs (5yr)</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">
                    ${chosenVehicle.totalFuelCost.toLocaleString()}
                  </div>
                  <div className={`text-sm ${fuelSavings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fuelSavings >= 0 ? '-' : '+'}${Math.abs(Math.round(fuelSavings))} vs avg
                  </div>
                </div>
                <div className="text-xs text-blue-300 mt-1">
                  {chosenVehicle.mpgCombined} MPG combined · {chosenVehicle.fuelType}
                </div>
              </div>

              {/* Maintenance */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-200 font-medium">Maintenance (5yr)</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-white">
                    ${chosenVehicle.totalMaintenanceCost.toLocaleString()}
                  </div>
                  <div className={`text-sm ${maintenanceSavings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {maintenanceSavings >= 0 ? '-' : '+'}${Math.abs(Math.round(maintenanceSavings))} vs avg
                  </div>
                </div>
              </div>

              {/* Resale Value */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-200 font-medium">Resale Value</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  ${chosenVehicle.resaleValue.toLocaleString()}
                </div>
                <div className="text-xs text-blue-300 mt-1">
                  After 5 years
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Comparison with Best/Worst */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold text-lg">How You Compare</h3>
              
              {chosenVehicle.id !== cheapest.id && (
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                  <div className="text-blue-200 text-sm mb-1">vs. Most Affordable Option</div>
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      {cheapest.year} {cheapest.make} {cheapest.model}
                    </div>
                    <div className={`font-semibold ${savingsVsCheapest >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {savingsVsCheapest >= 0 ? '+' : '-'}${Math.abs(Math.round(savingsVsCheapest))}
                    </div>
                  </div>
                </div>
              )}

              {chosenVehicle.id !== mostExpensive.id && (
                <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-4">
                  <div className="text-purple-200 text-sm mb-1">vs. Most Expensive Option</div>
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      {mostExpensive.year} {mostExpensive.make} {mostExpensive.model}
                    </div>
                    <div className="font-semibold text-green-400">
                      Save ${Math.round(savingsVsMostExpensive).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Key Advantages */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30 rounded-lg p-4">
              <h3 className="text-yellow-300 font-semibold mb-3">Your Numerical Advantages</h3>
              <ul className="space-y-2 text-white">
                {totalSavings > 0 && (
                  <li className="flex items-start gap-2">
                    <Badge className="bg-green-500/20 text-green-300 mt-0.5">✓</Badge>
                    <span>Save <strong>${totalSavings.toLocaleString()}</strong> compared to average competitor over 5 years</span>
                  </li>
                )}
                {monthlySavings > 0 && (
                  <li className="flex items-start gap-2">
                    <Badge className="bg-green-500/20 text-green-300 mt-0.5">✓</Badge>
                    <span>Pay <strong>${monthlySavings}</strong> less per month</span>
                  </li>
                )}
                {fuelSavings > 1000 && (
                  <li className="flex items-start gap-2">
                    <Badge className="bg-green-500/20 text-green-300 mt-0.5">✓</Badge>
                    <span>Save <strong>${Math.round(fuelSavings).toLocaleString()}</strong> on fuel over 5 years</span>
                  </li>
                )}
                {chosenVehicle.mpgCombined >= 35 && (
                  <li className="flex items-start gap-2">
                    <Badge className="bg-blue-500/20 text-blue-300 mt-0.5">★</Badge>
                    <span>Excellent fuel efficiency at <strong>{chosenVehicle.mpgCombined} MPG</strong></span>
                  </li>
                )}
                {chosenVehicle.resaleValue > chosenVehicle.msrp * 0.55 && (
                  <li className="flex items-start gap-2">
                    <Badge className="bg-blue-500/20 text-blue-300 mt-0.5">★</Badge>
                    <span>Strong resale value retention (<strong>{((chosenVehicle.resaleValue / chosenVehicle.msrp) * 100).toFixed(0)}%</strong> after 5 years)</span>
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => router.push("/results")}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            View All Options
          </Button>
          <Button
            onClick={() => router.push("/insights")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            View Detailed Insights
          </Button>
        </div>
      </div>
    </div>
  );
}
