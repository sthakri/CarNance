import { CarModel, CarType } from './domain';

export interface RecommendInput {
  financials: {
    monthlyIncome: number;
    spouseIncome?: number;
    monthlyBudget?: number;
    creditScore: number;
    downPayment?: number;
    goal?: 'lowest-monthly' | 'ownership' | 'eco';
  };
  driving: {
    avgMonthlyMileage: number;
    preferredType: CarType;
    size?: 'Compact' | 'Sedan' | 'SUV' | 'Truck';
    leaseTermMonths?: number;
    loanTermMonths?: number;
  };
}

export interface RecommendedModel extends Pick<CarModel, 'name' | 'type' | 'msrp'> {
  monthlyEstimate: number;
  rationale: string;
}


