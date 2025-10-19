export type CreditScoreBand = "300-579" | "580-669" | "670-739" | "740-799" | "800-850";

export type CarType = "sedan" | "suv" | "truck" | "coupe" | "hatchback" | "convertible";

export interface PersonalInfo {
  name: string;
  age: number;
}

export interface FinancialInfo {
  monthlyIncome: number;
  spouseIncome?: number;
  creditScore: CreditScoreBand;
  assets?: number;
}

export interface DrivingInfo {
  dailyMiles: number;
}

export interface CarPreferences {
  mode: "recommend" | "choose";
  carType?: CarType;
  budget?: number;
  downPayment?: number;
  // High-level insights fields
  fuelPreference?: "any" | "gas" | "hybrid" | "electric";
  ownershipYears?: number;
  region?: string;
  usage?: "commute" | "family" | "haul" | "mixed";
  riskTolerance?: "low" | "medium" | "high";
}

export interface OnboardingFormValues extends PersonalInfo, FinancialInfo, DrivingInfo {
  preferences: CarPreferences;
  financePath?: "lease" | "buy";
}
