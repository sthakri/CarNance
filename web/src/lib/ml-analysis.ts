/**
 * Machine Learning Analysis Utilities
 * Simulates ML predictions and clustering for car financing recommendations
 */

export type UserProfile = {
  age: number;
  monthlyIncome: number;
  spouseIncome?: number;
  creditScore: string;
  dailyMiles: number;
  preferences: {
    fuelPreference?: string;
    ownershipYears?: number;
    usage?: string;
    riskTolerance?: string;
  };
};

export type MLPrediction = {
  affordabilityScore: number; // 0-100
  financialStabilityScore: number; // 0-100
  lifestyleMatchScore: number; // 0-100
  riskScore: number; // 0-100
  predictedSatisfaction: number; // 0-100
  userCluster: string;
  clusterDescription: string;
};

export type TimeSeriesPoint = {
  month: number;
  creditScore: number;
  netWorth: number;
  totalPaid: number;
};

export type ComparisonMetrics = {
  category: string;
  userValue: number;
  averageValue: number;
  percentile: number;
};

/**
 * K-means clustering simulation for user profiling
 */
export function clusterUserProfile(profile: UserProfile): { cluster: string; description: string } {
  const totalIncome = profile.monthlyIncome + (profile.spouseIncome || 0);
  const creditMidpoint = getCreditScoreMidpoint(profile.creditScore);
  
  // Define clusters based on income, credit, and risk tolerance
  if (totalIncome > 10000 && creditMidpoint > 740) {
    return {
      cluster: "Premium",
      description: "High income, excellent credit - ideal for premium vehicles and aggressive financing"
    };
  } else if (totalIncome > 7000 && creditMidpoint > 670) {
    return {
      cluster: "Established Professional",
      description: "Strong financial foundation - good balance of affordability and quality"
    };
  } else if (totalIncome > 4000 && creditMidpoint > 580) {
    return {
      cluster: "Growing Family",
      description: "Budget-conscious with moderate credit - focus on value and reliability"
    };
  } else if (profile.age < 30 && creditMidpoint > 670) {
    return {
      cluster: "Young Professional",
      description: "Building wealth - prioritize affordable payments and credit building"
    };
  } else {
    return {
      cluster: "Value Seeker",
      description: "Cost-sensitive buyer - focus on affordability and long-term savings"
    };
  }
}

/**
 * Random Forest simulation for affordability prediction
 */
export function predictAffordability(profile: UserProfile, vehiclePrice: number): number {
  const totalIncome = profile.monthlyIncome + (profile.spouseIncome || 0);
  const creditMidpoint = getCreditScoreMidpoint(profile.creditScore);
  
  // Feature importance weights
  const incomeWeight = 0.4;
  const creditWeight = 0.3;
  const debtRatioWeight = 0.2;
  const ageWeight = 0.1;
  
  // Normalize features
  const incomeScore = Math.min(totalIncome / 15000, 1) * 100;
  const creditScore = (creditMidpoint - 300) / (850 - 300) * 100;
  const monthlyPayment = estimateMonthlyPayment(vehiclePrice, profile.creditScore);
  const debtRatio = monthlyPayment / totalIncome;
  const debtScore = Math.max(0, (1 - debtRatio / 0.3) * 100);
  const ageScore = profile.age < 25 ? 70 : profile.age > 50 ? 85 : 100;
  
  const affordabilityScore = 
    incomeScore * incomeWeight +
    creditScore * creditWeight +
    debtScore * debtRatioWeight +
    ageScore * ageWeight;
  
  return Math.round(Math.min(100, Math.max(0, affordabilityScore)));
}

/**
 * Neural Network simulation for financial stability prediction
 */
export function predictFinancialStability(profile: UserProfile): number {
  const totalIncome = profile.monthlyIncome + (profile.spouseIncome || 0);
  const creditMidpoint = getCreditScoreMidpoint(profile.creditScore);
  const hasSpouseIncome = profile.spouseIncome ? 1 : 0;
  const riskTolerance = profile.preferences.riskTolerance || "medium";
  
  // Hidden layer 1
  const h1_1 = sigmoid(totalIncome * 0.0001 + creditMidpoint * 0.001 + hasSpouseIncome * 0.5);
  const h1_2 = sigmoid(profile.age * 0.02 + creditMidpoint * 0.0008 - 0.5);
  const h1_3 = sigmoid(totalIncome * 0.00015 + (riskTolerance === "low" ? 0.8 : 0.2));
  
  // Hidden layer 2
  const h2_1 = sigmoid(h1_1 * 0.8 + h1_2 * 0.6 - 0.3);
  const h2_2 = sigmoid(h1_2 * 0.7 + h1_3 * 0.9 + 0.2);
  
  // Output layer
  const output = sigmoid(h2_1 * 1.2 + h2_2 * 1.1);
  
  return Math.round(output * 100);
}

/**
 * Time series prediction using LSTM-style approach
 */
export function predictCreditTimeSeries(
  profile: UserProfile,
  monthlyPayment: number,
  months: number = 60
): TimeSeriesPoint[] {
  const currentCredit = getCreditScoreMidpoint(profile.creditScore);
  const totalIncome = profile.monthlyIncome + (profile.spouseIncome || 0);
  const debtRatio = monthlyPayment / totalIncome;
  
  const points: TimeSeriesPoint[] = [];
  let creditScore = currentCredit;
  let netWorth = 0;
  let totalPaid = 0;
  
  // Simulate LSTM memory cells
  let cellState = 0.5; // Long-term memory
  let hiddenState = 0.5; // Short-term memory
  
  for (let month = 0; month <= months; month++) {
    // LSTM forget gate
    const forgetGate = sigmoid(debtRatio * -2 + hiddenState * 0.5);
    cellState *= forgetGate;
    
    // LSTM input gate
    const inputGate = sigmoid(month * 0.01 + (1 - debtRatio) * 2);
    const newInfo = Math.tanh(month * 0.02 + creditScore * 0.001);
    cellState += inputGate * newInfo;
    
    // LSTM output gate
    const outputGate = sigmoid(cellState + hiddenState);
    hiddenState = outputGate * Math.tanh(cellState);
    
    // Credit score prediction
    const baseIncrease = debtRatio < 0.15 ? 1.2 : debtRatio < 0.25 ? 0.8 : 0.4;
    const momentum = hiddenState * 20;
    creditScore = Math.min(850, creditScore + baseIncrease + momentum * 0.1);
    
    // Net worth calculation
    const equity = month > 0 ? (monthlyPayment * 0.7 * month) : 0; // Simplified equity
    const savings = (totalIncome - monthlyPayment) * 0.1 * month;
    netWorth = equity + savings;
    
    totalPaid = monthlyPayment * month;
    
    if (month % 6 === 0) { // Every 6 months
      points.push({
        month,
        creditScore: Math.round(creditScore),
        netWorth: Math.round(netWorth),
        totalPaid: Math.round(totalPaid),
      });
    }
  }
  
  return points;
}

/**
 * Gradient Boosting simulation for lifestyle match scoring
 */
export function predictLifestyleMatch(profile: UserProfile, vehicleType: string): number {
  const usage = profile.preferences.usage || "mixed";
  const dailyMiles = profile.dailyMiles;
  
  // Tree 1: Usage match
  let score1 = 0;
  if (usage === "commute" && dailyMiles > 30) {
    score1 = vehicleType.includes("hybrid") || vehicleType.includes("electric") ? 30 : 15;
  } else if (usage === "family") {
    score1 = vehicleType.includes("suv") || vehicleType.includes("sedan") ? 30 : 10;
  } else if (usage === "haul") {
    score1 = vehicleType.includes("truck") ? 30 : 15;
  } else {
    score1 = 20;
  }
  
  // Tree 2: Mileage efficiency
  let score2 = 0;
  if (dailyMiles > 50) {
    score2 = vehicleType.includes("hybrid") || vehicleType.includes("electric") ? 25 : 10;
  } else if (dailyMiles > 30) {
    score2 = 20;
  } else {
    score2 = 15;
  }
  
  // Tree 3: Age and vehicle type
  let score3 = 0;
  if (profile.age < 30) {
    score3 = vehicleType.includes("sedan") || vehicleType.includes("coupe") ? 25 : 15;
  } else if (profile.age > 40) {
    score3 = vehicleType.includes("suv") ? 25 : 18;
  } else {
    score3 = 20;
  }
  
  // Gradient boosting combination with learning rate
  const learningRate = 0.3;
  const finalScore = score1 + score2 * learningRate + score3 * learningRate * 0.8;
  
  return Math.round(Math.min(100, finalScore));
}

/**
 * Generate comparison metrics vs. similar users
 */
export function generateComparisonMetrics(profile: UserProfile): ComparisonMetrics[] {
  const totalIncome = profile.monthlyIncome + (profile.spouseIncome || 0);
  const creditMidpoint = getCreditScoreMidpoint(profile.creditScore);
  
  return [
    {
      category: "Monthly Income",
      userValue: totalIncome,
      averageValue: 6500,
      percentile: calculatePercentile(totalIncome, 3000, 15000),
    },
    {
      category: "Credit Score",
      userValue: creditMidpoint,
      averageValue: 680,
      percentile: calculatePercentile(creditMidpoint, 300, 850),
    },
    {
      category: "Daily Commute",
      userValue: profile.dailyMiles,
      averageValue: 30,
      percentile: calculatePercentile(profile.dailyMiles, 5, 100),
    },
    {
      category: "Age",
      userValue: profile.age,
      averageValue: 38,
      percentile: calculatePercentile(profile.age, 18, 75),
    },
  ];
}

// Helper functions

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

function estimateMonthlyPayment(msrp: number, creditScore: string, downPayment = 0): number {
  const principal = msrp - downPayment;
  const termMonths = 60;
  
  const aprMap: Record<string, number> = {
    "300-579": 0.14,
    "580-669": 0.10,
    "670-739": 0.07,
    "740-799": 0.05,
    "800-850": 0.04,
  };
  const apr = aprMap[creditScore] || 0.07;
  
  const monthlyRate = apr / 12;
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  
  return Math.round(payment);
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function calculatePercentile(value: number, min: number, max: number): number {
  return Math.round(((value - min) / (max - min)) * 100);
}
