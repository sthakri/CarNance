export type CarType = 'Gas' | 'Hybrid' | 'EV';

export interface CarModel {
  name: string;
  type: CarType;
  msrp: number;
  mpg?: number;
  mpge?: number;
  size: 'Compact' | 'Sedan' | 'SUV' | 'Truck';
  aprBase: number;
  leaseResidualPct: number;
  fuelType?: string;
  co2GramsPerMile?: number;
}


