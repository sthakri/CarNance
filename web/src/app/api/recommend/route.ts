import { NextResponse } from "next/server";
import inventory from "@/data/toyota-inventory.json";

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
  };
};

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
} {
  let score = 0;
  const reasons: string[] = [];
  
  const maxPayment = calculateMaxMonthlyPayment(data);
  const downPayment = data.preferences.downPayment || 0;
  const monthlyPayment = estimateMonthlyPayment(vehicle.msrp, data.creditScore, downPayment);
  
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
    // Families or older buyers might prefer SUVs
    if (data.age > 35 && vehicle.bodyType === "suv" && vehicle.seats >= 7) {
      score += 15;
      reasons.push("Spacious family vehicle");
    }
    // Younger buyers might prefer sedans/hatchbacks
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
    // Prefer newer, low-depreciation vehicles
    if (vehicle.year >= 2024) {
      score += 10;
      reasons.push("Great lease option");
    }
    // Hybrids/EVs have good lease incentives
    if (vehicle.fuelType === "hybrid" || vehicle.fuelType === "electric") {
      score += 5;
      reasons.push("Strong lease incentives");
    }
  } else if (pathPref === "buy") {
    // Prefer reliable, good resale value
    if (vehicle.fuelType === "hybrid") {
      score += 10;
      reasons.push("Excellent resale value");
    }
    // Long-term fuel savings matter more
    if (vehicle.mpgCombined >= 35) {
      score += 5;
      reasons.push("Long-term fuel savings");
    }
  }
  
  return { score, reasons, monthlyPayment };
}

export async function POST(request: Request) {
  try {
    const data: OnboardingData = await request.json();
    
    // Score all vehicles
    const scored = inventory.map((vehicle) => {
      const result = scoreVehicle(vehicle, data);
      return {
        vehicle,
        ...result,
      };
    });
    
    // Sort by score descending and take top 3
    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item, index) => ({
        rank: index + 1,
        vehicle: item.vehicle,
        monthlyPayment: item.monthlyPayment,
        reasons: item.reasons,
        score: Math.round(item.score),
      }));
    
    return NextResponse.json({
      ok: true,
      recommendations,
      maxMonthlyPayment: Math.round(calculateMaxMonthlyPayment(data)),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
}
