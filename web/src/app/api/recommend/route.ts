import { NextResponse } from "next/server";
import inventory from "@/data/toyota-inventory.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Vehicle = typeof inventory[0];

type OnboardingData = {
  name: string;
  age: number;
  monthlyIncome: number;
  spouseIncome?: number;
  creditScore: "300-579" | "580-669" | "670-739" | "740-799" | "800-850";
  assets?: number;
  dailyMiles: number;
  financePath?: "lease" | "buy";
  preferences: {
    mode: "recommend" | "choose";
    carType?: "sedan" | "suv" | "truck" | "coupe" | "hatchback" | "convertible";
    budget?: number;
    downPayment?: number;
    fuelPreference?: "any" | "gas" | "hybrid" | "electric" | "gasoline";
    ownershipYears?: number;
    region?: string;
    usage?: "commute" | "family" | "haul" | "mixed";
    riskTolerance?: "low" | "medium" | "high";
  };
};

// Minimum income eligibility thresholds
const MINIMUM_MONTHLY_INCOME = 2500;

// Check if user is eligible for car financing
function checkEligibility(data: OnboardingData): {
  eligible: boolean;
  reason?: string;
  suggestedActions?: string[];
} {
  const totalIncome = data.monthlyIncome + (data.spouseIncome || 0);
  
  // Income too low
  if (totalIncome < MINIMUM_MONTHLY_INCOME) {
    return {
      eligible: false,
      reason: `Your total monthly income ($${totalIncome.toLocaleString()}) is below our minimum requirement of $${MINIMUM_MONTHLY_INCOME.toLocaleString()}.`,
      suggestedActions: [
        "Consider increasing your income through additional work or side jobs",
        "Add a co-signer with higher income",
        "Save up to purchase a used vehicle with cash",
        "Look into public transportation or ride-sharing alternatives",
        "Explore employer transportation benefits or programs"
      ]
    };
  }
  
  // Very poor credit with low income
  if (data.creditScore === "300-579" && totalIncome < 3500) {
    return {
      eligible: false,
      reason: "Your combination of credit score and income level does not meet our financing criteria.",
      suggestedActions: [
        "Work on improving your credit score (pay bills on time, reduce debt)",
        "Increase your monthly income to at least $3,500",
        "Consider a secured credit card to rebuild credit",
        "Wait 6-12 months while improving your financial situation",
        "Explore credit counseling services"
      ]
    };
  }
  
  // Check debt-to-income ratio estimation
  const maxCarPayment = totalIncome * 0.15; // Conservative estimate
  const minVehiclePrice = 15000; // Cheapest reasonable vehicle
  const estimatedPayment = minVehiclePrice / 60; // 5-year loan
  
  if (maxCarPayment < estimatedPayment) {
    return {
      eligible: false,
      reason: `Based on your income, your maximum recommended car payment is $${Math.round(maxCarPayment)}/month, which may not be sufficient for most vehicles.`,
      suggestedActions: [
        "Increase your income or add a co-signer",
        "Save for a larger down payment to reduce monthly payments",
        "Consider more affordable used vehicle options",
        "Look for vehicles under $15,000",
        "Explore lease options with lower monthly payments"
      ]
    };
  }
  
  return { eligible: true };
}

// Calculate total cost of ownership over 5 years
function calculateTotalCost(
  vehicle: Vehicle,
  monthlyPayment: number,
  dailyMiles: number,
  termMonths = 60
): {
  totalPurchaseCost: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalInsuranceCost: number;
  totalCost: number;
  resaleValue: number;
  netCost: number;
} {
  const totalPurchaseCost = monthlyPayment * termMonths;
  
  // Fuel cost calculation (assume $3.50/gallon for gas, $0.13/kWh for electric)
  const annualMiles = dailyMiles * 365;
  let totalFuelCost = 0;
  
  if (vehicle.fuelType === "electric") {
    const kWhPer100Miles = 33; // Average for EVs
    const costPerKWh = 0.13;
    totalFuelCost = (annualMiles / 100) * kWhPer100Miles * costPerKWh * 5;
  } else {
    const gasCostPerGallon = 3.50;
    const annualGallons = annualMiles / vehicle.mpgCombined;
    totalFuelCost = annualGallons * gasCostPerGallon * 5;
  }
  
  const totalMaintenanceCost = (vehicle.maintenanceCostPerYear || 500) * 5;
  const totalInsuranceCost = (vehicle.insuranceCostPerMonth || 150) * 60;
  
  const totalCost = totalPurchaseCost + totalFuelCost + totalMaintenanceCost + totalInsuranceCost;
  
  // Resale value after 5 years
  const resaleValue = vehicle.msrp * ((vehicle.resaleValuePercent || 50) / 100);
  const netCost = totalCost - resaleValue;
  
  return {
    totalPurchaseCost,
    totalFuelCost,
    totalMaintenanceCost,
    totalInsuranceCost,
    totalCost,
    resaleValue,
    netCost
  };
}

// Calculate affordability based on income and credit
function calculateMaxMonthlyPayment(data: OnboardingData): number {
  const totalIncome = data.monthlyIncome + (data.spouseIncome || 0);
  // Rule of thumb: car payment should be 10-15% of gross monthly income
  const basePayment = totalIncome * 0.12;
  
  // Adjust for credit score (affects interest rates)
  const creditMultiplier = {
    "300-579": 0.7,  // Poor credit -> lower budget
    "580-669": 0.85, // Fair credit
    "670-739": 1.0,  // Good credit
    "740-799": 1.1,  // Very good credit
    "800-850": 1.15, // Excellent credit
  }[data.creditScore];
  
  return basePayment * creditMultiplier;
}

// Estimate monthly payment from MSRP
function estimateMonthlyPayment(
  msrp: number,
  creditScore: string,
  downPayment = 0
): number {
  const principal = msrp - downPayment;
  const termMonths = 60; // 5-year loan
  
  // Interest rate based on credit score
  const aprMap: Record<string, number> = {
    "300-579": 0.14,  // 14%
    "580-669": 0.10,  // 10%
    "670-739": 0.07,  // 7%
    "740-799": 0.05,  // 5%
    "800-850": 0.04,  // 4%
  };
  const apr = aprMap[creditScore] || 0.07;
  
  const monthlyRate = apr / 12;
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return Math.round(payment);
}

// Score vehicle based on user preferences
function scoreVehicle(vehicle: Vehicle, data: OnboardingData): {
  score: number;
  reasons: string[];
  monthlyPayment: number;
  costAnalysis: ReturnType<typeof calculateTotalCost>;
} {
  let score = 0;
  const reasons: string[] = [];
  
  const maxPayment = calculateMaxMonthlyPayment(data);
  const downPayment = data.preferences.downPayment || 0;
  const monthlyPayment = estimateMonthlyPayment(vehicle.msrp, data.creditScore, downPayment);
  const costAnalysis = calculateTotalCost(vehicle, monthlyPayment, data.dailyMiles);
  
  // 1. Affordability (40% weight)
  if (monthlyPayment <= maxPayment) {
    const affordabilityRatio = monthlyPayment / maxPayment;
    score += (1 - affordabilityRatio) * 40; // Better score if well under budget
    if (affordabilityRatio < 0.8) {
      reasons.push("Well within budget");
    } else {
      reasons.push("Fits your budget");
    }
  } else {
    score -= 50; // Heavy penalty if over budget
  }
  
  // 2. Fuel efficiency (30% weight) - based on daily miles
  const annualMiles = data.dailyMiles * 365;
  let efficiencyScore = 0;
  
  if (vehicle.fuelType === "electric") {
    efficiencyScore = 30;
    if (annualMiles > 15000) {
      reasons.push("Electric = major savings on high mileage");
    } else {
      reasons.push("Zero emissions");
    }
  } else if (vehicle.fuelType === "hybrid") {
    efficiencyScore = 25;
    if (vehicle.mpgCombined >= 40) {
      reasons.push("Exceptional fuel economy");
    } else {
      reasons.push("Great hybrid efficiency");
    }
  } else {
    // Gas vehicles - scale by MPG
    const mpgScore = Math.min(vehicle.mpgCombined / 40, 1);
    efficiencyScore = mpgScore * 20;
    if (vehicle.mpgCombined >= 30) {
      reasons.push("Good fuel economy");
    }
  }
  
  // Bonus for high daily miles + efficient vehicle
  if (data.dailyMiles > 50 && (vehicle.fuelType === "hybrid" || vehicle.fuelType === "electric")) {
    efficiencyScore += 10;
    reasons.push("Perfect for your daily commute");
  }
  
  score += efficiencyScore;
  
  // 3. Body type preference (20% weight)
  if (data.preferences.mode === "choose" && data.preferences.carType) {
    if (vehicle.bodyType === data.preferences.carType) {
      score += 20;
      reasons.push(`Matches your ${data.preferences.carType} preference`);
    }
  } else {
    // Auto-recommend based on profile
    if (data.age > 35 && vehicle.bodyType === "suv" && vehicle.seats >= 7) {
      score += 15;
      reasons.push("Spacious family vehicle");
    }
    if (data.age < 30 && (vehicle.bodyType === "sedan" || vehicle.bodyType === "hatchback")) {
      score += 10;
      reasons.push("Great for young professionals");
    }
  }
  
  // 4. Safety (10% weight)
  if (vehicle.safetyRating === 5) {
    score += 10;
    reasons.push("5-star safety rating");
  } else if (vehicle.safetyRating === 4) {
    score += 5;
  }
  
  // 5. Specific budget match if provided
  if (data.preferences.budget) {
    const targetPayment = data.preferences.budget;
    const paymentDiff = Math.abs(monthlyPayment - targetPayment);
    if (paymentDiff < targetPayment * 0.1) {
      score += 15;
      reasons.push("Matches your target payment");
    }
  }
  
  // 6. Finance path optimization (15% weight)
  const pathPref = data.financePath ?? "buy";
  if (pathPref === "lease") {
    if (vehicle.year >= 2024) {
      score += 10;
      reasons.push("Great lease option");
    }
    if (vehicle.fuelType === "hybrid" || vehicle.fuelType === "electric") {
      score += 5;
      reasons.push("Strong lease incentives");
    }
  } else if (pathPref === "buy") {
    if (vehicle.fuelType === "hybrid") {
      score += 10;
      reasons.push("Excellent resale value");
    }
    if (vehicle.mpgCombined >= 35) {
      score += 5;
      reasons.push("Long-term fuel savings");
    }
  }
  
  return { score, reasons, monthlyPayment, costAnalysis };
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    // Basic shape validation and safe defaults
    const data: OnboardingData = {
      name: raw?.name,
      age: Number(raw?.age),
      monthlyIncome: Number(raw?.monthlyIncome),
      spouseIncome: raw?.spouseIncome ? Number(raw?.spouseIncome) : undefined,
      creditScore: raw?.creditScore,
      assets: raw?.assets ? Number(raw?.assets) : undefined,
      dailyMiles: Number(raw?.dailyMiles),
      financePath: raw?.financePath,
      preferences: {
        mode: raw?.preferences?.mode ?? "recommend",
        carType: raw?.preferences?.carType,
        budget: raw?.preferences?.budget ? Number(raw?.preferences?.budget) : undefined,
        downPayment: raw?.preferences?.downPayment ? Number(raw?.preferences?.downPayment) : undefined,
        fuelPreference: raw?.preferences?.fuelPreference ?? "any",
        ownershipYears: raw?.preferences?.ownershipYears ? Number(raw?.preferences?.ownershipYears) : undefined,
        region: raw?.preferences?.region,
        usage: raw?.preferences?.usage,
        riskTolerance: raw?.preferences?.riskTolerance,
      },
    } as OnboardingData;

    // Required fields guard
    const missing: string[] = [];
    if (!data.age && data.age !== 0) missing.push("age");
    if (!data.monthlyIncome && data.monthlyIncome !== 0) missing.push("monthlyIncome");
    if (!data.creditScore) missing.push("creditScore");
    if (!data.dailyMiles && data.dailyMiles !== 0) missing.push("dailyMiles");
    if (!data.preferences) missing.push("preferences");
    if (missing.length) {
      return NextResponse.json(
        { ok: false, error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }
    
    // Check eligibility first
    const eligibility = checkEligibility(data);
    if (!eligibility.eligible) {
      return NextResponse.json({
        ok: false,
        eligible: false,
        reason: eligibility.reason,
        suggestedActions: eligibility.suggestedActions
      });
    }
    
    // Filter inventory based on higher-level preferences
    let pool = inventory.slice();
    
    // Fuel preference filter (safe)
    if (data.preferences?.fuelPreference && data.preferences.fuelPreference !== "any") {
      const fuelPref = data.preferences.fuelPreference === "gas" ? "gasoline" : data.preferences.fuelPreference;
      pool = pool.filter((v) => v.fuelType === fuelPref);
    }
    
    // Usage-based filters
    if (data.preferences?.usage === "haul") {
      pool = pool.filter((v) => v.bodyType === "truck" || v.horsepower >= 250);
    }
    if (data.preferences?.usage === "family") {
      pool = pool.filter((v) => v.bodyType === "suv" || v.seats >= 5);
    }

    // Score filtered vehicles
    const scored = pool.map((vehicle) => {
      const result = scoreVehicle(vehicle, data);
      return {
        vehicle,
        ...result,
      };
    });
    
    // Sort by score descending and take top 5
    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item, index) => ({
        rank: index + 1,
        vehicle: item.vehicle,
        monthlyPayment: item.monthlyPayment,
        reasons: item.reasons,
        score: Math.round(item.score),
        costAnalysis: item.costAnalysis
      }));
    
    // Calculate average of other cars for comparison
    const otherCars = scored.slice(5);
    const avgOtherCost = otherCars.length > 0 
      ? otherCars.reduce((sum, car) => sum + car.costAnalysis.netCost, 0) / otherCars.length
      : null;
    
    return NextResponse.json({
      ok: true,
      eligible: true,
      recommendations,
      maxMonthlyPayment: Math.round(calculateMaxMonthlyPayment(data)),
      averageCompetitorCost: avgOtherCost ? Math.round(avgOtherCost) : null
    });
  } catch (e) {
    const error = e as Error;
    return NextResponse.json(
      { ok: false, error: `Invalid request: ${error?.message ?? "unknown"}` },
      { status: 400 }
    );
  }
}
