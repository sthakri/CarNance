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
  financePath: "lease" | "buy" | "credit-build";
  preferences: {
    mode: "recommend" | "choose";
    carType?: "sedan" | "suv" | "truck" | "coupe" | "hatchback" | "convertible";
    budget?: number;
    downPayment?: number;
  };
};

type VehicleInsights = {
  vehicleId: string;
  vehicleName: string;
  financePath: "lease" | "buy" | "credit-build";
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
    impactLevel: "excellent" | "good" | "moderate" | "minimal";
    explanation: string;
  };
  savingsAnalysis: {
    vsAverageCar: {
      amount: number;
      category: "fuel" | "overall";
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

// Calculate APR based on credit score
function getAPR(creditScore: string): number {
  const aprMap: Record<string, number> = {
    "300-579": 0.14,
    "580-669": 0.10,
    "670-739": 0.07,
    "740-799": 0.05,
    "800-850": 0.04,
  };
  return aprMap[creditScore] || 0.07;
}

// Get numeric credit score midpoint
function getCreditScoreMidpoint(range: string): number {
  const midpoints: Record<string, number> = {
    "300-579": 440,
    "580-669": 625,
    "670-739": 705,
    "740-799": 770,
    "800-850": 825,
  };
  return midpoints[range] || 700;
}

// Calculate 5-year projection
function calculateFiveYearProjection(
  vehicle: Vehicle,
  data: OnboardingData,
  monthlyPayment: number
): VehicleInsights["fiveYearProjection"] {
  const downPayment = data.preferences.downPayment || 0;
  const principal = vehicle.msrp - downPayment;
  const apr = getAPR(data.creditScore);
  
  // Calculate total interest over 60 months
  const totalPaid = monthlyPayment * 60;
  const interest = totalPaid - principal;
  
  // Estimate fuel costs (5 years)
  const annualMiles = data.dailyMiles * 365;
  const fuelPricePerGallon = 3.5;
  let fuelCost = 0;
  
  if (vehicle.fuelType === "electric") {
    // EV: ~$0.04 per mile (electricity)
    fuelCost = annualMiles * 0.04 * 5;
  } else if (vehicle.fuelType === "hybrid") {
    fuelCost = (annualMiles / vehicle.mpgCombined) * fuelPricePerGallon * 5;
  } else {
    fuelCost = (annualMiles / vehicle.mpgCombined) * fuelPricePerGallon * 5;
  }
  
  // Estimate insurance (~$150-250/mo based on vehicle value)
  const insuranceMonthly = Math.min(250, Math.max(150, vehicle.msrp / 400));
  const insuranceTotal = insuranceMonthly * 60;
  
  // Estimate maintenance (newer = less, avg $75-150/mo)
  const maintenanceMonthly = vehicle.year >= 2024 ? 75 : 100;
  const maintenanceTotal = maintenanceMonthly * 60;
  
  const totalCost = totalPaid + fuelCost + insuranceTotal + maintenanceTotal;
  
  return {
    totalCost: Math.round(totalCost),
    monthlyBreakdown: {
      payment: Math.round(monthlyPayment),
      insurance: Math.round(insuranceMonthly),
      fuel: Math.round(fuelCost / 60),
      maintenance: maintenanceMonthly,
      total: Math.round(monthlyPayment + insuranceMonthly + fuelCost / 60 + maintenanceMonthly),
    },
    breakdown: {
      principal: Math.round(principal),
      interest: Math.round(interest),
      fuel: Math.round(fuelCost),
      insurance: Math.round(insuranceTotal),
      maintenance: Math.round(maintenanceTotal),
    },
  };
}

// Predict credit score impact
function predictCreditImpact(
  data: OnboardingData,
  monthlyPayment: number
): VehicleInsights["creditImpact"] {
  const currentScore = getCreditScoreMidpoint(data.creditScore);
  const totalIncome = data.monthlyIncome + (data.spouseIncome || 0);
  const paymentRatio = monthlyPayment / totalIncome;
  
  let scoreDelta = 0;
  let explanation = "";
  let impactLevel: "excellent" | "good" | "moderate" | "minimal" = "moderate";
  
  // On-time payments build credit
  let paymentImpact = 35; // Average gain from consistent payments
  
  // Debt-to-income ratio impact
  if (paymentRatio < 0.10) {
    scoreDelta += paymentImpact + 15; // Very manageable
    impactLevel = "excellent";
    explanation = "This payment is very manageable for your income, allowing consistent on-time payments that significantly boost your credit score.";
  } else if (paymentRatio < 0.15) {
    scoreDelta += paymentImpact;
    impactLevel = "good";
    explanation = "This payment fits comfortably in your budget, enabling reliable payments that improve your credit score steadily.";
  } else if (paymentRatio < 0.20) {
    scoreDelta += paymentImpact - 10;
    impactLevel = "moderate";
    explanation = "This payment is at the upper range of affordability. Consistent payments will improve credit, but budget carefully.";
  } else {
    scoreDelta += paymentImpact - 25;
    impactLevel = "minimal";
    explanation = "This payment stretches your budget. While it can still build credit, there's higher risk of missed payments.";
  }
  
  // Credit-build path bonus
  if (data.financePath === "credit-build") {
    scoreDelta += 10;
  }
  
  // Cap scores at 850
  const projectedScore12Mo = Math.min(850, currentScore + Math.round(scoreDelta * 0.4));
  const projectedScore60Mo = Math.min(850, currentScore + Math.round(scoreDelta));
  
  return {
    currentScore: data.creditScore,
    projectedScoreAfter12Months: projectedScore12Mo,
    projectedScoreAfter60Months: projectedScore60Mo,
    scoreDelta: Math.round(scoreDelta),
    impactLevel,
    explanation,
  };
}

// Calculate savings vs average
function calculateSavingsAnalysis(
  vehicle: Vehicle,
  projection: VehicleInsights["fiveYearProjection"],
  allProjections: { vehicleId: string; vehicleName: string; totalCost: number }[]
): VehicleInsights["savingsAnalysis"] {
  // Average car costs ~$45k over 5 years
  const averageCarCost = 45000;
  const savings = averageCarCost - projection.totalCost;
  
  // Compare to other vehicles
  const comparisons = allProjections
    .filter((p) => p.vehicleId !== vehicle.id)
    .sort((a, b) => Math.abs(b.totalCost - projection.totalCost) - Math.abs(a.totalCost - projection.totalCost))
    .slice(0, 2)
    .map((p) => ({
      comparedTo: p.vehicleName,
      amount: Math.round(projection.totalCost - p.totalCost),
    }));
  
  return {
    vsAverageCar: {
      amount: Math.round(savings),
      category: vehicle.fuelType === "electric" || vehicle.fuelType === "hybrid" ? "fuel" : "overall",
    },
    vsOtherOptions: comparisons,
  };
}

// Generate recommendation
function generateRecommendation(
  vehicle: Vehicle,
  data: OnboardingData,
  projection: VehicleInsights["fiveYearProjection"],
  creditImpact: VehicleInsights["creditImpact"],
  isTopChoice: boolean
): VehicleInsights["recommendation"] {
  const pros: string[] = [];
  const cons: string[] = [];
  
  // Analyze affordability
  if (projection.monthlyBreakdown.total < (data.monthlyIncome + (data.spouseIncome || 0)) * 0.12) {
    pros.push("Very affordable monthly cost");
  } else {
    cons.push("Higher monthly commitment");
  }
  
  // Fuel efficiency
  if (vehicle.fuelType === "electric") {
    pros.push("Zero fuel costs (electric)");
  } else if (vehicle.mpgCombined >= 40) {
    pros.push("Excellent fuel economy");
  } else if (vehicle.mpgCombined < 25) {
    cons.push("Lower fuel efficiency");
  }
  
  // Credit impact
  if (creditImpact.impactLevel === "excellent" || creditImpact.impactLevel === "good") {
    pros.push(`${creditImpact.impactLevel === "excellent" ? "Excellent" : "Good"} credit building potential`);
  }
  
  // Safety
  if (vehicle.safetyRating === 5) {
    pros.push("Top safety rating");
  }
  
  // Finance path alignment
  if (data.financePath === "lease" && vehicle.year >= 2024) {
    pros.push("Great lease option (new model)");
  } else if (data.financePath === "buy" && vehicle.fuelType === "hybrid") {
    pros.push("Strong resale value");
  } else if (data.financePath === "credit-build" && projection.monthlyBreakdown.payment < 400) {
    pros.push("Perfect for credit building");
  }
  
  let reason = "";
  if (isTopChoice) {
    reason = `Best overall match for your ${data.financePath} path with strong ${
      creditImpact.impactLevel === "excellent" ? "credit building" : "financial"
    } benefits.`;
  } else {
    reason = `Solid alternative offering good value with ${projection.monthlyBreakdown.total < 600 ? "affordable" : "competitive"} monthly costs.`;
  }
  
  return {
    isTopChoice,
    reason,
    pros,
    cons,
  };
}

export async function POST(request: Request) {
  try {
    const { userData, recommendedVehicles } = await request.json() as {
      userData: OnboardingData;
      recommendedVehicles: { vehicleId: string; monthlyPayment: number; rank: number }[];
    };
    
    // Calculate projections for all recommended vehicles
    const allProjections = recommendedVehicles.map((rec) => {
      const vehicle = inventory.find((v) => v.id === rec.vehicleId)!;
      const projection = calculateFiveYearProjection(vehicle, userData, rec.monthlyPayment);
      return {
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.year} ${vehicle.model}`,
        totalCost: projection.totalCost,
      };
    });
    
    // Generate insights for each vehicle
    const insights: VehicleInsights[] = recommendedVehicles.map((rec) => {
      const vehicle = inventory.find((v) => v.id === rec.vehicleId)!;
      const projection = calculateFiveYearProjection(vehicle, userData, rec.monthlyPayment);
      const creditImpact = predictCreditImpact(userData, rec.monthlyPayment);
      const savingsAnalysis = calculateSavingsAnalysis(vehicle, projection, allProjections);
      const recommendation = generateRecommendation(
        vehicle,
        userData,
        projection,
        creditImpact,
        rec.rank === 1
      );
      
      return {
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        financePath: userData.financePath,
        fiveYearProjection: projection,
        creditImpact,
        savingsAnalysis,
        recommendation,
      };
    });
    
    return NextResponse.json({ ok: true, insights });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
}
